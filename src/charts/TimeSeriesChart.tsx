import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../store/store';
import { LAYER_REGISTRY } from '../map/layerRegistry';
import type { LayerId } from '../data/types';

type ChartRow = { time: string } & Partial<Record<LayerId, number>>;

export function TimeSeriesChart() {
  const timePoints = useAppSelector((s) => s.timePoints);
  const selectedTimeIndex = useAppSelector((s) => s.selectedTimeIndex);
  const activeLayers = useAppSelector((s) => s.activeLayers);
  const layerDataCache = useAppSelector((s) => s.layerDataCache);
  const dispatch = useAppDispatch();

  const chartData = useMemo<ChartRow[]>(() => {
    return timePoints.map((tp) => {
      const row: ChartRow = { time: tp.label };
      for (const layerId of activeLayers) {
        const data = layerDataCache[layerId]?.[tp.timestamp];
        if (data && data.points.length > 0) {
          const avg =
            data.points.reduce((sum, p) => sum + p.value, 0) /
            data.points.length;
          row[layerId] = Math.round(avg * 10) / 10;
        }
      }
      return row;
    });
  }, [timePoints, activeLayers, layerDataCache]);

  const handleChartClick = (state: MouseHandlerDataParam) => {
    const idx = Number(state?.activeTooltipIndex);
    if (Number.isInteger(idx) && idx >= 0 && idx < timePoints.length) {
      dispatch('selectedTimeIndex', idx);
    }
  };

  const selectedLabel = timePoints[selectedTimeIndex]?.label;

  return (
    <div className="chart">
      <h3 className="chart__title">Временные ряды (средние по слоям)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          onClick={handleChartClick}
          margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          {/* Левая ось: температура + ветер */}
          <YAxis
            yAxisId="left"
            label={{
              value: '°C / м/с',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#888' },
            }}
          />
          {/* Правая ось: инсоляция */}
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Вт/м²',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 11, fill: '#888' },
            }}
          />
          <Tooltip />

          {activeLayers.map((layerId) => (
            <Line
              key={layerId}
              yAxisId={layerId === 'insolation' ? 'right' : 'left'}
              type="monotone"
              dataKey={layerId}
              name={LAYER_REGISTRY[layerId].name}
              stroke={LAYER_REGISTRY[layerId].color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}

          {selectedLabel && (
            <ReferenceLine
              yAxisId="left"
              x={selectedLabel}
              stroke="#666"
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
