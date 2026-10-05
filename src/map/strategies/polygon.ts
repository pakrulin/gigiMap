import type {
  Map as MapLibreMap,
  GeoJSONSource,
  ExpressionSpecification,
} from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import type { LayerConfig, LayerData } from '../../data/types';
import { GRID_STEP } from '../../data/generators';
import { findFirstLabelLayerId } from '.';

// Сторона квадрата чуть больше шага сетки — бесшовная укладка без щелей
const HALF = GRID_STEP * 0.54;

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [20, 20, 20];

function hexToRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r},${g},${b},${alpha})`;
}

// Контрастный градиент из цвета слоя: светлый оттенок → сам цвет → тёмный.
// Значение нормируется в свойство norm (0..1) при сборке данных,
// поэтому градиент фиксирован и не требует пересоздания слоя.
function buildColorRamp(color: string): ExpressionSpecification {
  const base = hexToRgb(color);
  return [
    'interpolate',
    ['linear'],
    ['get', 'norm'],
    0,
    rgba(mixRgb(base, WHITE, 0.7), 0.3),
    0.5,
    rgba(base, 0.6),
    1,
    rgba(mixRgb(base, BLACK, 0.4), 0.9),
  ];
}

export function syncPolygons(
  map: MapLibreMap,
  config: LayerConfig,
  data: LayerData | null,
  isActive: boolean,
  opacity: number
): void {
  const sourceId = `${config.id}-source`;
  const layerId = `${config.id}-layer`;

  if (!isActive || !data) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    return;
  }

  // Нормализация по реальному диапазону данных — градиент
  // используется целиком, а не сжимается в узкую полосу
  let min = Infinity;
  let max = -Infinity;
  for (const p of data.points) {
    if (p.value < min) min = p.value;
    if (p.value > max) max = p.value;
  }
  const span = max - min || 1;

  const geojson: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: data.points.map((p) => {
      const [lng, lat] = p.coordinates;
      return {
        type: 'Feature',
        properties: { value: p.value, norm: (p.value - min) / span },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lng - HALF, lat - HALF],
              [lng + HALF, lat - HALF],
              [lng + HALF, lat + HALF],
              [lng - HALF, lat + HALF],
              [lng - HALF, lat - HALF],
            ],
          ],
        },
      };
    }),
  };

  if (map.getSource(sourceId)) {
    (map.getSource(sourceId) as GeoJSONSource).setData(geojson);
    map.setPaintProperty(layerId, 'fill-opacity', opacity);
    return;
  }

  map.addSource(sourceId, { type: 'geojson', data: geojson });
  const beforeId = findFirstLabelLayerId(map);
  map.addLayer(
    {
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-opacity': opacity,
        'fill-color': buildColorRamp(config.color),
        'fill-outline-color': 'rgba(255,255,255,0.25)',
      },
    },
    beforeId
  );
}
