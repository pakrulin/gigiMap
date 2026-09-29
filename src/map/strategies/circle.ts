import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import type { LayerConfig, LayerData } from '../../data/types';
import { findFirstLabelLayerId } from '.';

export function syncCircles(
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

  const geojson: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: data.points.map((p) => ({
      type: 'Feature',
      properties: { value: p.value },
      geometry: { type: 'Point', coordinates: p.coordinates },
    })),
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
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0,
          3,
          15,
          14,
        ],
        'circle-color': config.color,
        'circle-opacity': 0.7,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    beforeId
  );
}
