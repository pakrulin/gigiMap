export type LayerId = 'temperature' | 'wind' | 'insolation';

export type RenderType = 'heatmap' | 'circle' | 'polygon';

export interface LayerConfig {
  id: LayerId;
  name: string;
  color: string;
  unit: string;
  renderType: RenderType;
}

export interface TimePoint {
  /** Unix ms */
  timestamp: number;
  /** "10:00" */
  label: string;
}

export interface LayerDataPoint {
  coordinates: [number, number]; // [lng, lat]
  value: number;
}

export interface LayerData {
  layerId: LayerId;
  timestamp: number;
  points: LayerDataPoint[];
}