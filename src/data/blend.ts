import type { LayerData } from './types';

/**
 * Линейная интерполяция двух наборов данных слоя.
 * Предполагает, что координаты точек совпадают (наши генераторы
 * детерминированы — точки всегда в одном порядке).
 */
export function blendLayerData(
  from: LayerData,
  to: LayerData,
  k: number
): LayerData {
  // k ∈ [0, 1]: 0 — полностью from, 1 — полностью to
  const points = from.points.map((p, i) => {
    const target = to.points[i];
    if (!target) return p; // страховка на случай разных длин
    return {
      coordinates: p.coordinates,
      value: p.value + (target.value - p.value) * k,
    };
  });

  return { ...from, points };
}

/** Плавная кривая (ease-in-out cubic) — убирает «рывок» в начале и конце. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
