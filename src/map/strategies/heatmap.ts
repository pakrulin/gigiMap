import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import type { LayerConfig, LayerData } from '../../data/types';
import { findFirstLabelLayerId } from '.';

export function syncHeatmap(
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
    map.setPaintProperty(layerId, 'heatmap-opacity', opacity);
    return;
  }

  map.addSource(sourceId, { type: 'geojson', data: geojson });
  const beforeId = findFirstLabelLayerId(map);
  map.addLayer(
    {
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0,
          0,
          30,
          1,
        ],
        'heatmap-intensity': 1,
        'heatmap-radius': 40,
        'heatmap-opacity': opacity,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0,0,255,0)',
          0.2,
          'rgba(0,128,255,0.5)',
          0.4,
          'rgba(0,255,128,0.7)',
          0.6,
          'rgba(255,255,0,0.8)',
          0.8,
          'rgba(255,128,0,0.9)',
          1,
          'rgba(255,0,0,1)',
        ],
      },
    },
    beforeId
  );
}
