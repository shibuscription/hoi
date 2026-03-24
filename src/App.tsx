import { useCallback, useMemo, useState } from "react";
import { ApiStatusNotice } from "./components/ApiStatusNotice";
import { CameraPreview } from "./components/CameraPreview";
import { GoogleMapView } from "./components/GoogleMapView";
import { HoiMapControls } from "./components/HoiMapControls";
import { MapPlaceholder } from "./components/MapPlaceholder";
import { StreetViewPanel } from "./components/StreetViewPanel";
import { MAP_ZOOM } from "./constants/map";
import { useCamera } from "./hooks/useCamera";
import { useCurrentLocation } from "./hooks/useCurrentLocation";
import { useNearbyStreetView } from "./hooks/useNearbyStreetView";
import { getGoogleMapsLoadStatus } from "./lib/googleMaps";
import type { MapOrientationMode, ScreenState } from "./types";
import type { CameraState } from "./types/camera";
import type { GoogleMapsCoordinates } from "./types/googleMaps";
import type { CurrentLocationState } from "./types/location";
import {
  buildGoogleMapsUrlForMap,
  buildGoogleMapsUrlForStreetView,
} from "./utils/googleMapsUrl";
import { calculateDistanceMeters } from "./utils/location";
import { normalizeHeading } from "./utils/mapHeading";

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
          <span>戻る</span>
        </button>
      ) : null}
      {children}
    </section>
  );
}

type SplitPanelProps = {
  top: React.ReactNode;
  bottom: React.ReactNode;
  centerAction?: React.ReactNode;
  fullMap?: boolean;
};

function SplitPanel({ top, bottom, centerAction, fullMap = false }: SplitPanelProps) {
  return (
    <div className={`split-layout ${fullMap ? "split-layout--map-full" : ""}`}>
      <div className="panel panel-top">{top}</div>
      <div className="panel panel-bottom">{bottom}</div>
      {centerAction ? <div className="split-layout__center-action">{centerAction}</div> : null}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("title");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapOrientationMode, setMapOrientationMode] =
    useState<MapOrientationMode>("north-up");
  const [viewHeading, setViewHeading] = useState<number | null>(null);
  const [appPosition, setAppPosition] = useState<GoogleMapsCoordinates | null>(null);
  const mapsStatus = getGoogleMapsLoadStatus();
  const { locationState, retryLocationRequest, refreshLocationRequest } = useCurrentLocation();
  const {
    cameraState,
    videoRef,
    captureFrame,
    retryCamera,
    clearCapturedImage,
  } = useCamera(screen === "camera-preview");
  const { streetViewState } = useNearbyStreetView(
    screen === "photo-confirmed" || screen === "hoi-completed",
    locationState,
  );

  const gpsPosition = useMemo<GoogleMapsCoordinates | null>(() => {
    if (locationState.status !== "success") {
      return null;
    }

    return {
      latitude: locationState.latitude,
      longitude: locationState.longitude,
    };
  }, [locationState]);

  const streetViewPosition = useMemo<GoogleMapsCoordinates | null>(() => {
    if (appPosition) {
      return appPosition;
    }

    if (streetViewState.status === "success") {
      return {
        latitude: streetViewState.panoramaLocationLat,
        longitude: streetViewState.panoramaLocationLng,
      };
    }

    return gpsPosition;
  }, [appPosition, gpsPosition, streetViewState]);

  const distanceFromGpsMeters = useMemo(() => {
    if (!gpsPosition) {
      return null;
    }

    const targetPosition = streetViewPosition ?? gpsPosition;

    return calculateDistanceMeters(
      gpsPosition.latitude,
      gpsPosition.longitude,
      targetPosition.latitude,
      targetPosition.longitude,
    );
  }, [gpsPosition, streetViewPosition]);

  const mapUrl = useMemo(() => {
    if (!appPosition) {
      return null;
    }

    return buildGoogleMapsUrlForMap(appPosition);
  }, [appPosition]);

  const streetViewUrl = useMemo(() => {
    const heading = normalizeHeading(viewHeading);

    if (!appPosition || heading === null) {
      return null;
    }

    return buildGoogleMapsUrlForStreetView({
      latitude: appPosition.latitude,
      longitude: appPosition.longitude,
      heading,
    });
  }, [appPosition, viewHeading]);

  const goToTitle = () => {
    setScreen("title");
    setIsMapFullscreen(false);
    setMapOrientationMode("north-up");
    setViewHeading(null);
    setAppPosition(null);
  };

  const startHoi = () => {
    clearCapturedImage();
    setViewHeading(null);
    setAppPosition(null);
    setIsMapFullscreen(false);
    setMapOrientationMode("north-up");
    setScreen("camera-preview");
  };

  const capturePhoto = () => {
    const imageDataUrl = captureFrame();

    if (imageDataUrl) {
      setScreen("photo-confirmed");
    }
  };

  const completeHoi = () => {
    setViewHeading((current) => normalizeHeading(current));
    setAppPosition(gpsPosition);
    setScreen("hoi-completed");
  };

  const handleStreetViewHeadingChange = useCallback((heading: number | null) => {
    setViewHeading(normalizeHeading(heading));
  }, []);

  const handleStreetViewPositionChange = useCallback((position: GoogleMapsCoordinates | null) => {
    if (!position) {
      return;
    }

    setAppPosition(position);
  }, []);

  const handleReturnToCurrentLocation = useCallback(async () => {
    if (gpsPosition) {
      setAppPosition(gpsPosition);
      return;
    }

    const nextLocationState = await refreshLocationRequest();

    if (nextLocationState.status === "success") {
      setAppPosition({
        latitude: nextLocationState.latitude,
        longitude: nextLocationState.longitude,
      });
    }
  }, [gpsPosition, refreshLocationRequest]);

  return (
    <main className="app-shell">
      <div className="app-stage">
        {screen === "title" ? (
          <ScreenFrame>
            <div className="title-screen">
              <div className="title-screen__map-layer">
                {mapsStatus.status !== "missing-api-key" && gpsPosition ? (
                  <GoogleMapView
                    appPosition={gpsPosition}
                    className="title-screen__live-map"
                    interactive={false}
                    locationState={locationState}
                    showGpsMarker={false}
                    variant="background"
                    zoom={MAP_ZOOM.title}
                  />
                ) : (
                  <div className="title-screen__map-bg">
                    <div className="title-screen__roads" />
                    <div className="title-screen__cards">
                      <div className="bg-card bg-card--one" />
                      <div className="bg-card bg-card--two" />
                      <div className="bg-card bg-card--three" />
                    </div>
                  </div>
                )}
              </div>

              <div className="title-screen__overlay-layer">
                <div className="title-screen__overlay" />
              </div>

              <div className="title-screen__content-layer">
                <div className="title-screen__content">
                  <h1>あっち向いてHOI</h1>
                  <p className="title-screen__subtitle">Heading Oriented Interface</p>
                  {(locationState.status === "permission-denied" ||
                    locationState.status === "error") && (
                    <div className="title-screen__location-note">
                      <ApiStatusNotice
                        tone="warning"
                        title={
                          locationState.status === "permission-denied"
                            ? "位置情報を利用できません"
                            : "位置情報を取得できませんでした"
                        }
                        message={locationState.errorMessage}
                      />
                    </div>
                  )}
                  {(locationState.status === "permission-denied" ||
                    locationState.status === "error") && (
                    <button
                      className="secondary-button title-screen__retry"
                      onClick={() => void retryLocationRequest()}
                      type="button"
                    >
                      位置情報を再取得
                    </button>
                  )}

                  <button className="primary-button" onClick={startHoi} type="button">
                    HOIする
                  </button>
                </div>
              </div>
            </div>
          </ScreenFrame>
        ) : null}

        {screen === "camera-preview" ? (
          <ScreenFrame showBack onBack={goToTitle}>
            <SplitPanel
              top={
                <div className="camera-stage">
                  <CameraPreview cameraState={cameraState} mode="live" videoRef={videoRef} />
                  {getCameraNotice(cameraState) && cameraState.status !== "loading" ? (
                    <div className="camera-stage__notice">
                      <ApiStatusNotice
                        tone={getCameraNotice(cameraState)!.tone}
                        title={getCameraNotice(cameraState)!.title}
                        message={getCameraNotice(cameraState)!.message}
                      />
                    </div>
                  ) : null}
                  {(cameraState.status === "permission-denied" ||
                    cameraState.status === "unsupported" ||
                    cameraState.status === "error") && (
                    <div className="camera-stage__actions">
                      <button className="secondary-button" onClick={retryCamera} type="button">
                        カメラを再取得
                      </button>
                    </div>
                  )}
                </div>
              }
              centerAction={
                <button
                  aria-disabled={cameraState.status !== "ready"}
                  className={`shutter-button ${cameraState.status !== "ready" ? "shutter-button--disabled" : ""}`}
                  disabled={cameraState.status !== "ready"}
                  onClick={capturePhoto}
                  type="button"
                >
                  <span className="shutter-button__inner" />
                </button>
              }
              bottom={
                <MapArea
                  appPosition={gpsPosition}
                  locationState={locationState}
                  mapsStatus={mapsStatus.status}
                  retryLocationRequest={() => void retryLocationRequest()}
                  zoom={MAP_ZOOM.main}
                />
              }
            />
          </ScreenFrame>
        ) : null}

        {screen === "photo-confirmed" || screen === "hoi-completed" ? (
          <ScreenFrame showBack onBack={goToTitle}>
            <div
              className={`workflow-layout ${
                screen === "hoi-completed" ? "workflow-layout--hoi-completed" : ""
              } ${isMapFullscreen ? "workflow-layout--map-full" : ""}`}
            >
              <div className="workflow-layout__secondary panel">
                {screen === "photo-confirmed" ? (
                  <CameraPreview
                    cameraState={cameraState}
                    capturedImageDataUrl={cameraState.capturedImageDataUrl}
                    mode="captured"
                    videoRef={videoRef}
                  />
                ) : (
                  <div className="map-stage">
                    <div className="map-stage__surface">
                      <MapArea
                        appPosition={appPosition}
                        fullMap={isMapFullscreen}
                        heading={viewHeading}
                        locationState={locationState}
                        mapsStatus={mapsStatus.status}
                        orientationMode={mapOrientationMode}
                        retryLocationRequest={() => void retryLocationRequest()}
                        showGpsMarker
                        zoom={MAP_ZOOM.hoiCompleted}
                      />
                    </div>
                    <div className="map-stage__actions">
                      <div className="map-controls">
                        <HoiMapControls
                          canReturnToCurrentLocation={
                            gpsPosition !== null || locationState.status === "success"
                          }
                          isMapFullscreen={isMapFullscreen}
                          mapOrientationMode={mapOrientationMode}
                          mapUrl={mapUrl}
                          onReturnToCurrentLocation={() => void handleReturnToCurrentLocation()}
                          onToggleFullscreen={() => setIsMapFullscreen((current) => !current)}
                          onToggleOrientationMode={() =>
                            setMapOrientationMode((current) =>
                              current === "north-up" ? "heading-up" : "north-up",
                            )
                          }
                          streetViewUrl={streetViewUrl}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="workflow-layout__street panel">
                <StreetViewPanel
                  currentHeading={viewHeading}
                  currentPosition={screen === "hoi-completed" ? appPosition : streetViewPosition}
                  distanceFromGpsMeters={distanceFromGpsMeters}
                  onHeadingChange={handleStreetViewHeadingChange}
                  onPositionChange={handleStreetViewPositionChange}
                  streetViewState={streetViewState}
                />
              </div>

              {screen === "photo-confirmed" ? (
                <div className="split-layout__center-action">
                  <button
                    className={`hoi-button ${streetViewState.status !== "success" ? "hoi-button--disabled" : ""}`}
                    disabled={streetViewState.status !== "success"}
                    onClick={completeHoi}
                    type="button"
                  >
                    HOI
                  </button>
                </div>
              ) : null}
            </div>
          </ScreenFrame>
        ) : null}
      </div>
    </main>
  );
}

type MapAreaProps = {
  locationState: CurrentLocationState;
  mapsStatus: string;
  retryLocationRequest: () => void;
  zoom: number;
  fullMap?: boolean;
  orientationMode?: MapOrientationMode;
  heading?: number | null;
  appPosition?: GoogleMapsCoordinates | null;
  showGpsMarker?: boolean;
};

function MapArea({
  locationState,
  mapsStatus,
  retryLocationRequest,
  zoom,
  fullMap = false,
  orientationMode = "north-up",
  heading = null,
  appPosition = null,
  showGpsMarker = false,
}: MapAreaProps) {
  if (mapsStatus === "missing-api-key") {
    return <MapPlaceholder fullMap={fullMap} message="Google Maps の設定を追加すると地図を表示できます。" />;
  }

  if (locationState.status === "loading" || locationState.status === "idle") {
    return <MapPlaceholder fullMap={fullMap} message="位置情報を取得しています。" tone="neutral" />;
  }

  if (locationState.status === "permission-denied" || locationState.status === "error") {
    return (
      <div className="map-error-state">
        <MapPlaceholder fullMap={fullMap} message={locationState.errorMessage} />
        <div className="map-error-state__actions">
          <button className="secondary-button" onClick={retryLocationRequest} type="button">
            位置情報を再取得
          </button>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapView
      appPosition={appPosition}
      fullMap={fullMap}
      heading={heading}
      interactive
      locationState={locationState}
      orientationMode={orientationMode}
      showGpsMarker={showGpsMarker}
      zoom={zoom}
    />
  );
}

function getCameraNotice(cameraState: CameraState): {
  tone: "warning" | "neutral";
  title: string;
  message: string;
} | null {
  switch (cameraState.status) {
    case "loading":
      return {
        tone: "neutral",
        title: "カメラを起動中です",
        message: "映像の準備ができるまで少し待ってください。",
      };
    case "permission-denied":
      return {
        tone: "warning",
        title: "カメラを利用できません",
        message: cameraState.errorMessage ?? "権限設定を見直してください。",
      };
    case "unsupported":
    case "error":
      return {
        tone: "warning",
        title: "カメラを起動できません",
        message: cameraState.errorMessage ?? "端末やブラウザの設定を確認してください。",
      };
    default:
      return null;
  }
}
