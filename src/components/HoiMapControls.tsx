import type { MapOrientationMode } from "../types";
import { MapOverlayIconButton } from "./MapOverlayIconButton";

type HoiMapControlsProps = {
  mapOrientationMode: MapOrientationMode;
  onToggleOrientationMode: () => void;
  isMapFullscreen: boolean;
  onToggleFullscreen: () => void;
  onReturnToCurrentLocation: () => void;
  canReturnToCurrentLocation: boolean;
  mapUrl: string | null;
  streetViewUrl: string | null;
};

export function HoiMapControls({
  mapOrientationMode,
  onToggleOrientationMode,
  isMapFullscreen,
  onToggleFullscreen,
  onReturnToCurrentLocation,
  canReturnToCurrentLocation,
  mapUrl,
  streetViewUrl,
}: HoiMapControlsProps) {
  const isHeadingUp = mapOrientationMode === "heading-up";

  return (
    <div className="hoi-map-overlay" aria-label="地図操作">
      <div className="hoi-map-overlay__top-left">
        <MapOverlayIconButton
          ariaLabel={isHeadingUp ? "北固定に切り替える" : "進行方向固定に切り替える"}
          onClick={onToggleOrientationMode}
          title={isHeadingUp ? "進行方向固定" : "北固定"}
        >
          <span
            aria-hidden="true"
            className={`map-overlay-compass ${isHeadingUp ? "map-overlay-compass--heading-up" : "map-overlay-compass--north-up"}`}
          >
            <span className="map-overlay-compass__ring" />
            <span className="map-overlay-compass__needle" />
            <span className="map-overlay-compass__label">{isHeadingUp ? "↑" : "N"}</span>
          </span>
        </MapOverlayIconButton>
      </div>

      <div className="hoi-map-overlay__top-right">
        <MapOverlayIconButton
          ariaLabel="地図で開く"
          disabled={!mapUrl}
          href={mapUrl}
          title={mapUrl ? "地図で開く ↗" : "位置がまだ決まっていません"}
        >
          <span aria-hidden="true" className="map-overlay-icon">
            <span className="map-overlay-icon__glyph">M</span>
            <span className="map-overlay-icon__external">↗</span>
          </span>
        </MapOverlayIconButton>

        <MapOverlayIconButton
          ariaLabel="この向きの景色で開く"
          disabled={!streetViewUrl}
          href={streetViewUrl}
          title={streetViewUrl ? "この向きの景色で開く ↗" : "向きがまだ決まっていません"}
        >
          <span aria-hidden="true" className="map-overlay-icon">
            <span className="map-overlay-icon__glyph">SV</span>
            <span className="map-overlay-icon__external">↗</span>
          </span>
        </MapOverlayIconButton>
      </div>

      <div className="hoi-map-overlay__bottom-right">
        <MapOverlayIconButton
          ariaLabel="現在地に戻る"
          disabled={!canReturnToCurrentLocation}
          onClick={onReturnToCurrentLocation}
          title={canReturnToCurrentLocation ? "現在地に戻る" : "現在地を取得できません"}
        >
          <span aria-hidden="true" className="map-overlay-icon">
            <span className="map-overlay-icon__glyph">◎</span>
          </span>
        </MapOverlayIconButton>

        <MapOverlayIconButton
          ariaLabel={isMapFullscreen ? "地図を元に戻す" : "地図を全画面で開く"}
          onClick={onToggleFullscreen}
          title={isMapFullscreen ? "縮小" : "最大化"}
        >
          <span aria-hidden="true" className="map-overlay-expand">
            <span className="map-overlay-expand__glyph">{isMapFullscreen ? "—" : "+"}</span>
          </span>
        </MapOverlayIconButton>
      </div>
    </div>
  );
}
