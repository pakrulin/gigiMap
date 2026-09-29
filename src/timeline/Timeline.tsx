import { useAppDispatch, useAppSelector } from '../store/store';

export function Timeline() {
  const { timePoints, selectedTimeIndex } = useAppSelector((s) => ({
    timePoints: s.timePoints,
    selectedTimeIndex: s.selectedTimeIndex,
  }));
  const dispatch = useAppDispatch();

  return (
    <div className="timeline">
      <span className="timeline__label">Время:</span>
      <div className="timeline__buttons">
        {timePoints.map((tp, i) => (
          <button
            key={tp.timestamp}
            type="button"
            className={`timeline__button ${i === selectedTimeIndex ? 'is-active' : ''}`}
            onClick={() => dispatch('selectedTimeIndex', i)}
          >
            {tp.label}
          </button>
        ))}
      </div>
    </div>
  );
}
