import { useEffect, useMemo, useRef, useState } from "react";
import { ApiStatusNotice } from "./ApiStatusNotice";
import { getGoogleMapsLoadStatus, loadGoogleMapsApi } from "../lib/googleMaps";
import type { GoogleMapsCoordinates } from "../types/googleMaps";
import type { StreetViewConfidenceLevel, StreetViewState } from "../types/streetView";
import { normalizeHeading } from "../utils/mapHeading";

type StreetViewPanelProps = {
  streetViewState: StreetViewState;
  currentHeading?: number | null;
  currentPosition?: GoogleMapsCoordinates | null;
  distanceFromGpsMeters?: number | null;
  onHeadingChange?: (heading: number | null) => void;
  onPositionChange?: (position: GoogleMapsCoordinates | null) => void;
};

export function StreetViewPanel({
  streetViewState,
  currentHeading = null,
  currentPosition = null,
  distanceFromGpsMeters = null,
  onHeadingChange,
  onPositionChange,
}: StreetViewPanelProps) {
  const initialMapsStatus = useMemo(() => getGoogleMapsLoadStatus(), []);
  const [mapsStatus, setMapsStatus] = useState(initialMapsStatus);
  const panoramaElementRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const headingListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const positionListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (streetViewState.status !== "success") {
      return () => {
        cancelled = true;
      };
    }

    loadGoogleMapsApi().then((result) => {
      if (cancelled) {
        return;
      }

      setMapsStatus(result);

      if (result.status !== "loaded" || !panoramaElementRef.current) {
        return;
      }

      const initialHeading = normalizeHeading(currentHeading) ?? 0;
      const initialPosition = currentPosition
        ? {
            lat: currentPosition.latitude,
            lng: currentPosition.longitude,
          }
        : {
            lat: streetViewState.panoramaLocationLat,
            lng: streetViewState.panoramaLocationLng,
          };

      const panoramaOptions: google.maps.StreetViewPanoramaOptions = {
        visible: true,
        addressControl: false,
        fullscreenControl: false,
        motionTracking: false,
        showRoadLabels: true,
        zoomControl: true,
        position: initialPosition,
        pov: {
          heading: initialHeading,
          pitch: 0,
        },
      };

      if (!panoramaRef.current) {
        panoramaRef.current = new google.maps.StreetViewPanorama(
          panoramaElementRef.current,
          panoramaOptions,
        );
      } else {
        panoramaRef.current.setOptions(panoramaOptions);
        panoramaRef.current.setVisible(true);
        panoramaRef.current.setPosition(initialPosition);
        panoramaRef.current.setPov({
          heading: initialHeading,
          pitch: 0,
        });
      }

      const panorama = panoramaRef.current;

      const syncHeading = () => {
        onHeadingChange?.(normalizeHeading(panorama.getPov().heading));
      };

      const syncPosition = () => {
        const position = panorama.getPosition();

        if (!position) {
          onPositionChange?.(null);
          return;
        }

        onPositionChange?.({
          latitude: position.lat(),
          longitude: position.lng(),
        });
      };

      syncHeading();
      syncPosition();

      headingListenerRef.current?.remove();
      positionListenerRef.current?.remove();
      headingListenerRef.current = panorama.addListener("pov_changed", syncHeading);
      positionListenerRef.current = panorama.addListener("position_changed", syncPosition);
    });

    return () => {
      cancelled = true;
      headingListenerRef.current?.remove();
      positionListenerRef.current?.remove();
      headingListenerRef.current = null;
      positionListenerRef.current = null;
    };
  }, [onHeadingChange, onPositionChange, streetViewState]);

  useEffect(() => {
    const panorama = panoramaRef.current;
    const normalizedCurrentHeading = normalizeHeading(currentHeading);

    if (!panorama || normalizedCurrentHeading === null) {
      return;
    }

    const pov = panorama.getPov();
    const panoramaHeading = normalizeHeading(pov.heading);

    if (panoramaHeading === null || Math.abs(panoramaHeading - normalizedCurrentHeading) > 0.5) {
      panorama.setPov({
        heading: normalizedCurrentHeading,
        pitch: pov.pitch ?? 0,
      });
    }
  }, [currentHeading]);

  useEffect(() => {
    const panorama = panoramaRef.current;

    if (!panorama || !currentPosition) {
      return;
    }

    const position = panorama.getPosition();

    if (!position) {
      panorama.setPosition({
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
      });
      return;
    }

    const latDiff = Math.abs(position.lat() - currentPosition.latitude);
    const lngDiff = Math.abs(position.lng() - currentPosition.longitude);

    if (latDiff > 0.000001 || lngDiff > 0.000001) {
      panorama.setPosition({
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
      });
    }
  }, [currentPosition]);

  if (mapsStatus.status === "missing-api-key" || streetViewState.status === "missing-api-key") {
    return (
      <StreetViewFallback
        message="Google Maps の設定が完了すると景色を表示できます。"
      />
    );
  }

  if (streetViewState.status === "loading" || streetViewState.status === "idle") {
    return <StreetViewFallback message="近くの景色を探しています。" tone="neutral" />;
  }

  if (streetViewState.status === "not-found") {
    return (
      <StreetViewFallback
        message={streetViewState.errorMessage}
        detail="この場所では景色を取得できませんでした。"
      />
    );
  }

  if (streetViewState.status === "error") {
    return (
      <StreetViewFallback
        message={streetViewState.errorMessage}
        detail="景色の表示に失敗しました。"
      />
    );
  }

  return (
    <div className="street-view-live">
      <div ref={panoramaElementRef} className="street-view-live__canvas" />

      <div className="street-view-meta">
        {distanceFromGpsMeters !== null ? (
          <span className="street-view-meta__chip">ここから {distanceFromGpsMeters}m</span>
        ) : null}
        <span
          className={`street-view-meta__chip street-view-meta__chip--${streetViewState.confidenceLevel}`}
        >
          信頼度 {getConfidenceLabel(streetViewState.confidenceLevel ?? "low")}
        </span>
      </div>
    </div>
  );
}

function StreetViewFallback({
  message,
  detail = "向き合わせに使える景色がまだありません。",
  tone = "warning",
}: {
  message: string;
  detail?: string;
  tone?: "warning" | "neutral";
}) {
  return (
    <div className="street-view-mock">
      <div className="street-view-horizon" />
      <div className="street-view-overlay-message">
        <ApiStatusNotice tone={tone} title={message} message={detail} />
      </div>
    </div>
  );
}

function getConfidenceLabel(level: StreetViewConfidenceLevel) {
  switch (level) {
    case "high":
      return "高";
    case "medium":
      return "中";
    case "low":
      return "低";
    default:
      return "";
  }
}
