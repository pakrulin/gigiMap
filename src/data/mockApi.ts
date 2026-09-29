import type { LayerId, LayerData } from './types';
import { generatePoints } from './generators';

/**
 * Имитация асинхронного запроса данных слоя.
 * Уважает AbortSignal: если запрос отменён — reject с AbortError.
 */
export function fetchLayerData(
  layerId: LayerId,
  timestamp: number,
  signal: AbortSignal
): Promise<LayerData> {
  const delay = 250 + Math.random() * 450;

  return new Promise<LayerData>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve({
        layerId,
        timestamp,
        points: generatePoints(layerId, timestamp),
      });
    }, delay);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
