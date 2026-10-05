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
        <div key={layer.id} className="layer-panel__row">
          <label className="layer-panel__item">
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
          {activeLayers.includes(layer.id) && (
            <LayerOpacity layerId={layer.id} />
          )}
        </div>
      ))}
    </div>
  );
}

// Изолированный компонент — ре-рендерится только при изменении
// прозрачности конкретного слоя
function LayerOpacity({ layerId }: { layerId: LayerId }) {
  const opacity = useAppSelector((s) => s.layerOpacity[layerId]);
  const dispatch = useAppDispatch();

  return (
    <div className="layer-panel__opacity">
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(opacity * 100)}
        style={{ accentColor: LAYER_REGISTRY[layerId].color }}
        onChange={(e) =>
          dispatch((state) => ({
            layerOpacity: {
              ...state.layerOpacity,
              [layerId]: Number(e.target.value) / 100,
            },
          }))
        }
      />
      <span className="layer-panel__opacity-value">
        {Math.round(opacity * 100)}%
      </span>
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
