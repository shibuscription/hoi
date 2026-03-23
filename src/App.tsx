import { useState } from "react";
import { getGoogleMapsLoadStatus } from "./lib/googleMaps";
import { ApiStatusNotice } from "./components/ApiStatusNotice";
import { MapPlaceholder } from "./components/MapPlaceholder";
import type { MapOrientationMode, ScreenState } from "./types";

type ScreenFrameProps = {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
};

function ScreenFrame({ children, showBack = false, onBack }: ScreenFrameProps) {
  return (
    <section className="screen-frame">
      {showBack ? (
        <button className="icon-button back-button" onClick={onBack} type="button">
          <span aria-hidden="true">←</span>
          <span>タイトル</span>
        </button>
      ) : null}
      {children}
    </section>
  );
}

type SplitPanelProps = {
  top: React.ReactNode;
  bottom: React.ReactNode;
  divider?: React.ReactNode;
  fullMap?: boolean;
};

function SplitPanel({ top, bottom, divider, fullMap = false }: SplitPanelProps) {
  return (
    <div className={`split-layout ${fullMap ? "split-layout--map-full" : ""}`}>
      <div className="panel panel-top">{top}</div>
      <div className="panel-divider">{divider}</div>
      <div className="panel panel-bottom">{bottom}</div>
    </div>
  );
}

type CameraMockProps = {
  captured?: boolean;
};

function CameraMock({ captured = false }: CameraMockProps) {
  return (
    <div className={`camera-mock ${captured ? "camera-mock--captured" : ""}`}>
      <div className="camera-chrome">
        <span className="status-pill">{captured ? "Captured Photo" : "Camera Preview"}</span>
        <span className="status-dot" />
      </div>
      <div className="camera-grid" />
      <div className="camera-focus camera-focus--one" />
      <div className="camera-focus camera-focus--two" />
      <div className="camera-bottom-label">
        {captured ? "静止画として固定された状態のモック" : "撮影前プレビューのモック"}
      </div>
    </div>
  );
}

function StreetViewMock() {
  return (
    <div className="street-view-mock">
      <div className="street-view-horizon" />
      <div className="street-view-labels">
        <span className="status-pill">Street View (Mock)</span>
        <span className="hint-chip">drag to align</span>
      </div>
      <div className="street-view-drag">
        <div className="street-view-drag__track" />
        <div className="street-view-drag__handle" />
      </div>
      <div className="street-view-bottom-label">向きを手動で合わせる体験を表すモック</div>
    </div>
  );
}

function SyncedStreetViewMock() {
  return (
    <div className="street-view-mock street-view-mock--synced">
      <div className="street-view-horizon" />
      <div className="street-view-labels">
        <span className="status-pill">Street View Synced Preview</span>
        <span className="hint-chip">arrow linked</span>
      </div>
      <div className="sync-ring" />
      <div className="street-view-bottom-label">将来的に地図上の向きと連動する想定のモック</div>
    </div>
  );
}

function OrientationToggle({
  value,
  onChange,
}: {
  value: MapOrientationMode;
  onChange: (nextValue: MapOrientationMode) => void;
}) {
  return (
    <div className="toggle-group" role="tablist" aria-label="地図の向き切替">
      <button
        className={`toggle-button ${value === "north-up" ? "active" : ""}`}
        onClick={() => onChange("north-up")}
        type="button"
      >
        北固定
      </button>
      <button
        className={`toggle-button ${value === "heading-up" ? "active" : ""}`}
        onClick={() => onChange("heading-up")}
        type="button"
      >
        進行方向固定
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("title");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapOrientationMode, setMapOrientationMode] =
    useState<MapOrientationMode>("north-up");
  const mapsStatus = getGoogleMapsLoadStatus();

  const goToTitle = () => {
    setScreen("title");
    setIsMapFullscreen(false);
    setMapOrientationMode("north-up");
  };

  const startHoi = () => setScreen("camera-preview");
  const captureMockPhoto = () => setScreen("photo-confirmed");
  const completeHoi = () => setScreen("hoi-completed");

  return (
    <main className="app-shell">
      <div className="phone-stage">
        <div className="phone-stage__device">
          <div className="phone-stage__status">
            <span>9:41</span>
            <span>HOI Phase 1 Mock</span>
          </div>

          {screen === "title" ? (
            <ScreenFrame>
              <div className="title-screen">
                <div className="title-screen__map-bg">
                  <div className="title-screen__roads" />
                  <div className="title-screen__cards">
                    <div className="bg-card bg-card--one" />
                    <div className="bg-card bg-card--two" />
                    <div className="bg-card bg-card--three" />
                  </div>
                  <div className="title-screen__overlay" />
                </div>

                <div className="title-screen__content">
                  <p className="eyebrow">Phase 1 UI Mock</p>
                  <h1>あっち向いてHOI</h1>
                  <p className="subtitle">向きを合わせる補助アプリ</p>
                  <div className="title-screen__api-note">
                    <ApiStatusNotice
                      tone={mapsStatus.status === "missing-api-key" ? "warning" : "ready"}
                      title={mapsStatus.message}
                      message="Google Maps / Firebase 接続準備フェーズ"
                    />
                  </div>

                  <button className="primary-button" onClick={startHoi} type="button">
                    HOIする
                  </button>
                </div>
              </div>
            </ScreenFrame>
          ) : null}

          {screen === "camera-preview" ? (
            <ScreenFrame showBack onBack={goToTitle}>
              <SplitPanel
                top={<CameraMock />}
                divider={
                  <button className="shutter-button" onClick={captureMockPhoto} type="button">
                    <span className="shutter-button__inner" />
                  </button>
                }
                bottom={<MapPlaceholder />}
              />
            </ScreenFrame>
          ) : null}

          {screen === "photo-confirmed" ? (
            <ScreenFrame showBack onBack={goToTitle}>
              <SplitPanel
                top={<CameraMock captured />}
                divider={
                  <button className="hoi-button" onClick={completeHoi} type="button">
                    HOI
                  </button>
                }
                bottom={<StreetViewMock />}
              />
            </ScreenFrame>
          ) : null}

          {screen === "hoi-completed" ? (
            <ScreenFrame showBack onBack={goToTitle}>
              <SplitPanel
                fullMap={isMapFullscreen}
                top={<SyncedStreetViewMock />}
                bottom={
                  <div className="map-stage">
                    <MapPlaceholder
                      fullMap={isMapFullscreen}
                      orientationMode={mapOrientationMode}
                      showMarker
                      showArrow
                    />

                    <div className="map-controls">
                      <OrientationToggle
                        value={mapOrientationMode}
                        onChange={setMapOrientationMode}
                      />

                      <button
                        className="secondary-button"
                        onClick={() => setIsMapFullscreen((current) => !current)}
                        type="button"
                      >
                        {isMapFullscreen ? "地図を戻す" : "地図を大きく表示"}
                      </button>
                    </div>
                  </div>
                }
              />
            </ScreenFrame>
          ) : null}
        </div>
      </div>
    </main>
  );
}
