import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchLayerData } from '../data/mockApi';
import { blendLayerData, easeInOutCubic } from '../data/blend';
import { LAYER_REGISTRY, ALL_LAYER_IDS } from './layerRegistry';
import { getStrategy } from './strategies';
import type { LayerId, LayerData } from '../data/types';

const TRANSITION_MS = 450;

export function useMapLayers(map: MapLibreMap | null): void {
  const activeLayers = useAppSelector((s) => s.activeLayers);
  const selectedTimeIndex = useAppSelector((s) => s.selectedTimeIndex);
  const timePoints = useAppSelector((s) => s.timePoints);
  const layerDataCache = useAppSelector((s) => s.layerDataCache);
  const dispatch = useAppDispatch();

  const selectedTime = timePoints[selectedTimeIndex];

  const requestedRef = useRef(new Set<string>());
  const controllersRef = useRef<AbortController[]>([]);

  // Какой timestamp сейчас реально нарисован на карте
  const renderedTimestampRef = useRef<number | null>(null);

  // ——— Загрузка данных (без изменений) ———
  useEffect(() => {
    if (!selectedTime) return;
    const timestamp = selectedTime.timestamp;

    for (const layerId of activeLayers) {
      const key = `${layerId}:${timestamp}`;
      if (requestedRef.current.has(key)) continue;
      requestedRef.current.add(key);

      const controller = new AbortController();
      controllersRef.current.push(controller);

      dispatch((state) => ({
        loading: { ...state.loading, [layerId]: true },
        errors: { ...state.errors, [layerId]: null },
      }));

      fetchLayerData(layerId, timestamp, controller.signal)
        .then((data) => {
          dispatch((state) => ({
            layerDataCache: {
              ...state.layerDataCache,
              [layerId]: {
                ...state.layerDataCache[layerId],
                [timestamp]: data,
              },
            },
          }));
        })
        .catch((err: Error) => {
          requestedRef.current.delete(key);
          if (err.name === 'AbortError') return;
          dispatch((state) => ({
            errors: { ...state.errors, [layerId]: err.message },
          }));
        })
        .finally(() => {
          dispatch((state) => ({
            loading: { ...state.loading, [layerId]: false },
          }));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime, activeLayers, dispatch]);

  // ——— Отмена in-flight запросов при размонтировании (без изменений) ———
  useEffect(() => {
    return () => {
      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current = [];
    };
  }, []);

  // ——— Синхронизация с картой: с плавным переходом между timestamp ———
  useEffect(() => {
    if (!map || !selectedTime) return;

    const targetTimestamp = selectedTime.timestamp;
    const renderedTimestamp = renderedTimestampRef.current;

    // Первый рендер или повторное применение той же точки — без анимации
    if (renderedTimestamp === null || renderedTimestamp === targetTimestamp) {
      applyAllLayers(map, activeLayers, layerDataCache, targetTimestamp);
      renderedTimestampRef.current = targetTimestamp;
      return;
    }

    // Готовы ли данные для интерполяции?
    const canAnimate = activeLayers.every(
      (id) =>
        layerDataCache[id]?.[renderedTimestamp] &&
        layerDataCache[id]?.[targetTimestamp]
    );

    if (!canAnimate) {
      // Ждём загрузки данных — карта сохраняет предыдущее состояние.
      // Как только layerDataCache обновится, эффект сработает снова.
      // Но пассивные слои нужно обновить уже сейчас:
      for (const layerId of ALL_LAYER_IDS) {
        const config = LAYER_REGISTRY[layerId];
        const isActive = activeLayers.includes(layerId);
        if (!isActive) {
          getStrategy(config.renderType)(map, config, null, false);
        }
      }
      return;
    }

    // ——— Анимация перехода ———
    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TRANSITION_MS);
      const k = easeInOutCubic(t);

      for (const layerId of ALL_LAYER_IDS) {
        const config = LAYER_REGISTRY[layerId];
        const isActive = activeLayers.includes(layerId);

        if (!isActive) {
          getStrategy(config.renderType)(map, config, null, false);
          continue;
        }

        const from = layerDataCache[layerId]![renderedTimestamp];
        const to = layerDataCache[layerId]![targetTimestamp];
        const blended = blendLayerData(from, to, k);

        getStrategy(config.renderType)(map, config, blended, true);
      }

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        renderedTimestampRef.current = targetTimestamp;
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedTimeIndex, activeLayers, layerDataCache, timePoints]);
}

// ——— Вспомогательная функция: применить данные без анимации ———
function applyAllLayers(
  map: MapLibreMap,
  activeLayers: LayerId[],
  cache: Record<LayerId, Record<number, LayerData>>,
  timestamp: number
): void {
  for (const layerId of ALL_LAYER_IDS) {
    const config = LAYER_REGISTRY[layerId];
    const isActive = activeLayers.includes(layerId);
    const data = isActive ? (cache[layerId]?.[timestamp] ?? null) : null;

    getStrategy(config.renderType)(map, config, data, isActive);
  }
}
