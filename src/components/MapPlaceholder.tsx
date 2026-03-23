import { useMemo } from "react";
import type { MapOrientationMode } from "../types";
import { ApiStatusNotice } from "./ApiStatusNotice";
import { getGoogleMapsLoadStatus } from "../lib/googleMaps";

type MapPlaceholderProps = {
  orientationMode?: MapOrientationMode;
  showMarker?: boolean;
  showArrow?: boolean;
  fullMap?: boolean;
};

export function MapPlaceholder({
  orientationMode = "north-up",
  showMarker = false,
  showArrow = false,
  fullMap = false,
}: MapPlaceholderProps) {
  const mapsStatus = useMemo(() => getGoogleMapsLoadStatus(), []);

  return (
    <div className={`map-mock ${fullMap ? "map-mock--full" : ""}`}>
      <div className="map-pattern" />
      <div className="map-routes" />
      <div className="map-header">
        <span className="status-pill">Map Preview</span>
        <span className="map-mode-badge">
          {orientationMode === "north-up" ? "北固定" : "進行方向固定"}
        </span>
      </div>
      <div className={`compass-chip ${orientationMode}`}>
        <span>N</span>
      </div>
      {showMarker ? <div className="map-marker" /> : null}
      {showArrow ? (
        <div className={`heading-arrow ${orientationMode}`}>
          <div className="heading-arrow__shaft" />
          <div className="heading-arrow__tip" />
        </div>
      ) : null}

      <div className="map-dev-status">
        <ApiStatusNotice
          tone={mapsStatus.status === "missing-api-key" ? "warning" : "ready"}
          title={mapsStatus.message}
          message={
            mapsStatus.status === "missing-api-key"
              ? "`.env` に VITE_GOOGLE_MAPS_API_KEY を追加すると次フェーズで地図接続できます"
              : "次フェーズで Google Maps / Street View 接続を有効化できます"
          }
        />
      </div>

      <div className="map-bottom-label">
        {showArrow ? "現在地と向きを表示する地図モック" : "地図 SDK 未接続のプレビュー"}
      </div>
    </div>
  );
}
