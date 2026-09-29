import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LayerConfig, LayerData, RenderType } from '../../data/types';
import { syncHeatmap } from './heatmap';
import { syncCircles } from './circle';
import { syncPolygons } from './polygon';

export type SyncStrategy = (
  map: MapLibreMap,
  config: LayerConfig,
  data: LayerData | null,
  isActive: boolean
) => void;

const STRATEGIES: Record<RenderType, SyncStrategy> = {
  heatmap: syncHeatmap,
  circle: syncCircles,
  polygon: syncPolygons,
};

export function getStrategy(renderType: RenderType): SyncStrategy {
  return STRATEGIES[renderType];
}
// Утилита: найти ID первого слоя-подписи в стиле
export function findFirstLabelLayerId(map: MapLibreMap): string | undefined {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  // Ищем первый symbol-слой — обычно это подписи
  const labelLayer = style.layers.find((l) => l.type === 'symbol');
  return labelLayer?.id;
}
