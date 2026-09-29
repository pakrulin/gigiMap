import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import type { LayerConfig, LayerData } from '../../data/types';
import { findFirstLabelLayerId } from '.';

const HALF = 0.015;

export function syncPolygons(
  map: MapLibreMap,
  config: LayerConfig,
  data: LayerData | null,
  isActive: boolean
): void {
  const sourceId = `${config.id}-source`;
  const layerId = `${config.id}-layer`;

  if (!isActive || !data) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    return;
  }

  const maxValue = Math.max(...data.points.map((p) => p.value), 1);

  const geojson: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: data.points.map((p) => {
      const [lng, lat] = p.coordinates;
      return {
        type: 'Feature',
        properties: { value: p.value },
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
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0,
          'rgba(255,255,200,0.15)',
          maxValue * 0.5,
          'rgba(255,200,0,0.45)',
          maxValue,
          'rgba(255,100,0,0.7)',
        ],
        'fill-outline-color': 'rgba(255,255,255,0.25)',
      },
    },
    beforeId
  );
}
