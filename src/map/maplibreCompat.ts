import * as maplibregl from 'maplibre-gl';

// Внутренние поля MapLibre v6, до которых шим добирается осознанно
interface LegacyTransform {
  nearZ?: number;
  farZ?: number;
  _nearZ?: number;
  _farZ?: number;
}

interface MapProtoWithCamera {
  _camera?: { transform?: LegacyTransform };
  transform?: LegacyTransform;
}

let installed = false;

export function installMapTransformCompat(): void {
  if (installed || typeof window === 'undefined') return;

  const MapProto = maplibregl.Map.prototype as unknown as MapProtoWithCamera;

  // Если transform уже есть (v5) — ничего не делаем
  if ('transform' in MapProto) {
    installed = true;
    return;
  }

  Object.defineProperty(MapProto, 'transform', {
    configurable: true,
    get(this: MapProtoWithCamera) {
      const transform = this._camera?.transform;
      if (!transform) return undefined;

      // Алиасы для _nearZ/_farZ (v6 переименовал их в nearZ/farZ)
      if (!('_nearZ' in transform) && 'nearZ' in transform) {
        Object.defineProperty(transform, '_nearZ', {
          get(this: LegacyTransform) {
            return this.nearZ;
          },
          configurable: true,
        });
      }
      if (!('_farZ' in transform) && 'farZ' in transform) {
        Object.defineProperty(transform, '_farZ', {
          get(this: LegacyTransform) {
            return this.farZ;
          },
          configurable: true,
        });
      }

      return transform;
    },
  });

  installed = true;
}
