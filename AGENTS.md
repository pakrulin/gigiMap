# AGENTS.md

Файл для AI-агентов, работающих с этим репозиторием. Язык проекта (документация, комментарии, UI) — русский.

## Обзор проекта

**gigiMap** — тестовое задание: одностраничное React-приложение с интерактивной картой Бишкека. Три GIS-слоя (температура, ветер, инсоляция) с детерминированно сгенерированными mock-данными, timeline, синхронизированный график на Recharts и две 3D-модели (колесо обозрения, памятник Ленину) через deck.gl.

- Demo: https://pakrulin.github.io/gigiMap/
- Repo: https://github.com/pakrulin/gigiMap
- Backend нет — вся «асинхронность» имитируется `setTimeout` в `src/data/mockApi.ts`.

## Стек

- **React 19** + **TypeScript ~6.0** + **Vite 8** (ESM, `"type": "module"`)
- **Vedro** — управление состоянием (стор создаётся через `createVedro`)
- **MapLibre GL JS v6** — карта (базовый стиль OpenFreeMap Liberty, без API-ключа)
- **deck.gl 9** (`@deck.gl/mapbox` + `@deck.gl/mesh-layers`) — 3D-модели
- **Recharts 3** — графики

## Команды

```bash
npm install        # установка зависимостей (лок файлы: package-lock.json и yarn.lock — в CI используется npm)
npm run dev        # dev-сервер Vite
npm run build      # tsc -b && vite build → dist/
npm run preview    # предпросмотр production-сборки
npm run lint       # eslint по ts/tsx, --max-warnings 0
npm run format     # prettier --write по src/**/*.{ts,tsx,css}
```

Тестов в проекте нет (ни runner'а, ни test-файлов) — проверка качества = `npm run build` (строгий tsc) + `npm run lint`.

## Структура и границы модулей

```
src/
├── store/store.ts        # Vedro: AppState, createVedro, useAppSelector/useAppDispatch. Только состояние.
├── data/                 # types.ts, generators.ts (детерминированные генераторы, сетка точек
│                         # только внутри границы КР), kgBoundary.ts (граница КР + point-in-polygon),
│                         # mockApi.ts (fetchLayerData с AbortSignal), blend.ts (интерполяция + easeInOutCubic)
├── map/                  # MapLibre + deck.gl. Ничего не знает про Recharts/timeline.
│   ├── MapView.tsx       #   создание карты, регистрация воркера
│   ├── useMapLayers.ts   #   загрузка данных + синхронизация слоёв с анимацией перехода
│   ├── layerRegistry.ts  #   LAYER_REGISTRY: id/name/color/unit/renderType
│   ├── strategies/       #   heatmap.ts, circle.ts, polygon.ts — интерфейс SyncStrategy
│   │                     #   (map, config, data, isActive, opacity), регистрация в strategies/index.ts (getStrategy)
│   ├── use3DModels.ts    #   ScenegraphLayer ×2 + MapboxOverlay(interleaved)
│   └── maplibreCompat.ts #   шим transform для deck.gl + MapLibre v6 (см. ниже)
├── timeline/Timeline.tsx # управляет только selectedTimeIndex
├── charts/TimeSeriesChart.tsx  # визуализация; клик → dispatch('selectedTimeIndex', i)
├── components/LayerPanel.tsx   # чистый UI; LayerStatus и LayerOpacity изолированы отдельными компонентами
└── shared/               # time.ts и types.ts — пока пустые файлы
```

Поток данных: **Timeline → Store → Map + Chart**. Карта и график читают одни и те же поля стора (`selectedTimeIndex`, `activeLayers`, `layerDataCache`) через селекторы. Прозрачность слоёв — `layerOpacity: Record<LayerId, number>` (0–1), редактируется ползунком в LayerPanel и применяется стратегиями через `setPaintProperty`.

## Соглашения по коду

- **Vedro**: обновления только через `dispatch` — либо `dispatch('field', value)`, либо функционально `dispatch((state) => ({ ...частичное состояние }))`, возвращаем только изменившиеся поля. `useAppSelector` принимает селектор; компоненты читают только нужные им поля для точечных ре-рендеров.
- `activeLayers` — массив `LayerId[]`, **не** `Set` (надёжнее работает с реактивностью Vedro).
- Кэш данных по ключу `(layerId, timestamp)`; перед запросом — проверка `requestedRef: Set<string>`, чтобы запрос стартовал ровно один раз; на каждый запрос — `AbortController`.
- Тяжёлые анимации — мимо React: `requestAnimationFrame` + `easeInOutCubic` (450 мс), на каждом кадре `setData()` на MapLibre-источнике.
- Импорт типов — только через `import type` (`verbatimModuleSyntax` в tsconfig).
- tsconfig строгий: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch` — `tsc -b` входит в build и падает при нарушениях.
- Prettier: semi, singleQuote, tabWidth 2, trailingComma es5. CSS — один `src/index.css`, именование по БЭМ (`block__element`, модификатор `is-active`).
- Комментарии и UI-тексты — на русском.

## Особенности MapLibre v6 + deck.gl (критично)

- **Шим `installMapTransformCompat()`** (`src/map/maplibreCompat.ts`) — MapLibre v6 переместил `map.transform` в `map._camera.transform`, а deck.gl читает старый путь. Шим добавляет геттер на прототип `Map` и **должен быть вызван до создания первой карты** (вызывается на уровне модуля `MapView.tsx`).
- **Воркер**: импортируется явно `import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` и регистрируется через `maplibregl.setWorkerUrl(...)` до создания карты. В `vite.config.ts` обязательны: `optimizeDeps.exclude: ['maplibre-gl']`, `target: 'es2022'` (dev и build), `worker.format: 'es'`.
- **deck.gl**: overlay — `MapboxOverlay` с `interleaved: true`; у `ScenegraphLayer` поле `scenegraph` — строка-URL (не функция), иначе загрузка не триггернётся. У карты задан `pitch: 55` — без него 3D-модели не видно.
- 3D-модели лежат в `public/models/*.glb` и подключаются через `${import.meta.env.BASE_URL}models/...`.
- Новые типы слоёв: добавить стратегию в `src/map/strategies/` и зарегистрировать в `strategies/index.ts`; конфиг слоя — в `LAYER_REGISTRY`.

## Сборка и деплой

- `vite.config.ts` задаёт `base: '/gigiMap/'` — путь обязан совпадать с именем GitHub-репозитория.
- Деплой — GitHub Actions (`.github/workflows/deploy.yml`): push в `master` (или вручную) → `npm ci` (Node 20) → `npm run build` → публикация `dist/` на GitHub Pages. Основная ветка — `master`.
- При смене имени репозитория нужно синхронно поменять `base` в vite-конфиге.

## Безопасность

- Секретов и ключей в проекте нет; API-ключи не нужны (OpenFreeMap — открытый векторный стиль).
- Внешние ресурсы, загружаемые в рантайме: тайлы/стиль `tiles.openfreemap.org` и GLB-модели из `public/`.
- Не вводите реальные ключи/токены в код — архитектура их не предполагает.
