import { createVedro } from 'vedro';
import type { LayerId, LayerData, TimePoint } from '../data/types';

export interface AppState {
  activeLayers: LayerId[]; // ← было Set<LayerId>
  timePoints: TimePoint[];
  selectedTimeIndex: number;
  layerDataCache: Record<LayerId, Record<number, LayerData>>;
  loading: Record<LayerId, boolean>;
  errors: Record<LayerId, string | null>;
}

function buildTimePoints(
  startLabel: string,
  endLabel: string,
  stepMin: number
): TimePoint[] {
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMin(startLabel);
  const end = toMin(endLabel);
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  const points: TimePoint[] = [];
  for (let m = start; m <= end; m += stepMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const d = new Date(base);
    d.setHours(h, mm, 0, 0);
    points.push({
      timestamp: d.getTime(),
      label: `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    });
  }
  return points;
}

const initialState: AppState = {
  activeLayers: ['temperature', 'wind'], // ← массив
  timePoints: buildTimePoints('10:00', '14:00', 30),
  selectedTimeIndex: 0,
  layerDataCache: { temperature: {}, wind: {}, insolation: {} },
  loading: { temperature: false, wind: false, insolation: false },
  errors: { temperature: null, wind: null, insolation: null },
};

export const {
  Provider: AppStoreProvider,
  useSelector: useAppSelector,
  useDispatch: useAppDispatch,
  useStore: useAppStore,
} = createVedro(initialState);
