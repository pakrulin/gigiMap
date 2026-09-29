import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapLayers } from './useMapLayers';
import { use3DModels } from './use3DModels';

// Явный импорт воркера: ?worker&url заставляет Vite положить файл
// в отдельный ассет и вернуть его публичный URL (с хэшем).
// Это работает и в dev, и в build.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { installMapTransformCompat } from './maplibreCompat';

installMapTransformCompat();

// Регистрируем воркер ДО создания первой карты
maplibregl.setWorkerUrl(maplibreWorkerUrl);
export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [74.5698, 42.8746],
      zoom: 10,
      pitch: 55, // ← обязательно, иначе модели не видно сверху
      bearing: -20,
    });

    instance.addControl(new maplibregl.NavigationControl(), 'top-right');

    const onLoad = () => setMap(instance);
    instance.on('load', onLoad);

    return () => {
      instance.off('load', onLoad);
      instance.remove();
      setMap(null);
    };
  }, []);

  useMapLayers(map);
  use3DModels(map);

  return <div ref={containerRef} className="map" />;
}
