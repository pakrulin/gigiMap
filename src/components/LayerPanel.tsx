import { useAppDispatch, useAppSelector } from '../store/store';
import { LAYER_REGISTRY } from '../map/layerRegistry';
import type { LayerId } from '../data/types';

export function LayerPanel() {
  const activeLayers = useAppSelector((s) => s.activeLayers);
  const dispatch = useAppDispatch();

  const toggle = (layerId: LayerId) => {
    const isActive = activeLayers.includes(layerId);
    const next = isActive
      ? activeLayers.filter((id) => id !== layerId)
      : [...activeLayers, layerId];
    dispatch('activeLayers', next);
  };

  return (
    <div className="layer-panel">
      <h3>Слои</h3>
      {Object.values(LAYER_REGISTRY).map((layer) => (
        <label key={layer.id} className="layer-panel__item">
          <input
            type="checkbox"
            checked={activeLayers.includes(layer.id)}
            onChange={() => toggle(layer.id)}
          />
          <span
            className="layer-panel__color"
            style={{ background: layer.color }}
          />
          <span className="layer-panel__name">{layer.name}</span>
          <span className="layer-panel__unit">{layer.unit}</span>
          <LayerStatus layerId={layer.id} />
        </label>
      ))}
    </div>
  );
}

// Изолированный компонент — ре-рендерится только при изменении
// loading/errors конкретного слоя
function LayerStatus({ layerId }: { layerId: LayerId }) {
  const isLoading = useAppSelector((s) => s.loading[layerId]);
  const error = useAppSelector((s) => s.errors[layerId]);

  if (error) {
    return (
      <span className="layer-panel__error" title={error}>
        !
      </span>
    );
  }
  if (isLoading) {
    return <span className="layer-panel__loading">…</span>;
  }
  return null;
}
