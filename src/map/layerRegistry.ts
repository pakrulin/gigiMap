import type { LayerId, LayerConfig } from '../data/types';

export const LAYER_REGISTRY: Record<LayerId, LayerConfig> = {
  temperature: {
    id: 'temperature',
    name: 'Температура',
    color: '#ff6b35',
    unit: '°C',
    renderType: 'polygon',
  },
  wind: {
    id: 'wind',
    name: 'Ветер',
    color: '#4a90d9',
    unit: 'м/с',
    renderType: 'polygon',
  },
  insolation: {
    id: 'insolation',
    name: 'Инсоляция',
    color: '#f5c542',
    unit: 'Вт/м²',
    renderType: 'polygon',
  },
};

export const ALL_LAYER_IDS = Object.keys(LAYER_REGISTRY) as LayerId[];
