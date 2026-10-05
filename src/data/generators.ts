import type { LayerId, LayerDataPoint } from './types';
import { KG_BBOX, isInsideKyrgyzstan } from './kgBoundary';

// Бишкек — центр «теплового острова»
const CENTER: [number, number] = [74.5698, 42.8746];
export const GRID_STEP = 0.05;

// Масштаб нормализации координат для формул полей (в градусах)
const SCALE_X = 3;
const SCALE_Y = 2;

export function generatePoints(
  layerId: LayerId,
  timestamp: number
): LayerDataPoint[] {
  const date = new Date(timestamp);
  const hours = date.getHours() + date.getMinutes() / 60;
  const points: LayerDataPoint[] = [];

  // Сетка по bounding box страны, точки только внутри границы —
  // поле повторяет форму Кыргызстана
  for (let lng = KG_BBOX.minLng; lng <= KG_BBOX.maxLng; lng += GRID_STEP) {
    for (let lat = KG_BBOX.minLat; lat <= KG_BBOX.maxLat; lat += GRID_STEP) {
      if (!isInsideKyrgyzstan(lng, lat)) continue;
      const value = computeValue(layerId, lng, lat, hours);
      points.push({ coordinates: [lng, lat], value });
    }
  }
  return points;
}

function computeValue(
  layerId: LayerId,
  lng: number,
  lat: number,
  hours: number
): number {
  // Нормализованные координаты относительно Бишкека — удобно для формул
  const nx = (lng - CENTER[0]) / SCALE_X;
  const ny = (lat - CENTER[1]) / SCALE_Y;
  const distFromCenter = Math.sqrt(nx * nx + ny * ny);

  // «Тепловой остров» в центре города: гауссов пик
  const heatIsland = Math.exp(-distFromCenter * distFromCenter * 3);

  // Две бегущие волны для «рельефа» полей
  const wave1 = Math.sin(nx * 4 + hours * 0.5) * Math.cos(ny * 3);
  const wave2 = Math.sin((nx + ny) * 2.5 - hours * 0.3) * 0.5;

  switch (layerId) {
    case 'temperature': {
      // Базовый суточный ход: холодно утром, тепло после полудня
      const diurnal = 15 + 12 * Math.sin(((hours - 6) * Math.PI) / 12);
      // +4° в городе, ±2° рельефные колебания
      const value = diurnal + heatIsland * 4 + (wave1 + wave2) * 2;
      return round1(value);
    }
    case 'wind': {
      // Базовая скорость 4 м/с + порывы от рельефа
      const base = 4 + 3 * Math.abs(wave1) + 2 * Math.abs(wave2);
      // В центре города ветер гасится зданиями
      const shelter = 1 - heatIsland * 0.4;
      return round1(base * shelter + 1);
    }
    case 'insolation': {
      // Солнце: синус по времени суток, максимум в полдень
      const sun = Math.max(0, Math.sin(((hours - 6) * Math.PI) / 12));
      // Облака уменьшают инсоляцию — пятна на поле
      const clouds = 0.75 + 0.25 * Math.sin(nx * 5 - hours) * Math.cos(ny * 5);
      return Math.round(sun * clouds * 950);
    }
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
