import { useEffect } from 'react';
import type { Map as MapLibreMap, TransitionSpecification } from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';

interface ModelPoint {
  name: string;
  coordinates: [number, number];
  /** Высота над землёй, м */
  altitude: number;
  /** Масштаб модели */
  scale: number;
  /** Поворот вокруг Z, градусы */
  heading: number;
  /** Подъём модели (обычно 90, если модель «лежит») */
  pitch: number;
}

const FERRIS_WHEEL: ModelPoint = {
  name: 'Колесо обозрения',
  coordinates: [74.6002, 42.8797],
  altitude: 0,
  scale: 1,
  heading: 0,
  pitch: 90,
};

const LENIN: ModelPoint = {
  name: 'Памятник Ленину',
  coordinates: [74.606187, 42.877582],
  altitude: 0,
  scale: 1,
  heading: 0,
  pitch: 90,
};

export function use3DModels(map: MapLibreMap | null): void {
  useEffect(() => {
    if (!map) return;

    console.log('[3D] creating ScenegraphLayers');

    const ferrisLayer = new ScenegraphLayer<ModelPoint>({
      id: 'ferris-wheel',
      data: [FERRIS_WHEEL],
      scenegraph: '/models/ferris-wheel.glb', // строка, не функция
      getPosition: (d) => [d.coordinates[0], d.coordinates[1], d.altitude],
      getOrientation: (d) => [0, d.heading, d.pitch],
      getScale: (d) => [d.scale, d.scale, d.scale],
      sizeScale: 30, // временно большое, чтобы точно увидеть
      pickable: true,
      _lighting: 'pbr',
    });

    const leninLayer = new ScenegraphLayer<ModelPoint>({
      id: 'lenin-statue',
      data: [LENIN],
      scenegraph: '/models/lenin.glb',
      getPosition: (d) => [d.coordinates[0], d.coordinates[1], d.altitude],
      getOrientation: (d) => [0, d.heading, d.pitch],
      getScale: (d) => [d.scale, d.scale, d.scale],
      sizeScale: 0.2,
      pickable: true,
      _lighting: 'pbr',
    });

    const deckOverlay = new MapboxOverlay({
      interleaved: true,
      layers: [ferrisLayer, leninLayer],
    });

    map.addControl(deckOverlay);
    console.log('[3D] overlay added');

    // Скопируем стиль карты в overlay (для корректной синхронизации слоёв)
    const syncStyle = () => {
      const style = map.getStyle();
      if (style)
        deckOverlay.setProps({ style: style as TransitionSpecification });
    };
    map.on('styledata', syncStyle);
    syncStyle();

    return () => {
      map.off('styledata', syncStyle);
      map.removeControl(deckOverlay);
    };
  }, [map]);
}
