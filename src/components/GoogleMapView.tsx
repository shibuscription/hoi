import { useEffect, useMemo, useRef, useState } from "react";
import type { MapOrientationMode } from "../types";
import { getGoogleMapsMapId } from "../config/env";
import { getGoogleMapsLoadStatus, loadGoogleMapsApi } from "../lib/googleMaps";
import type { GoogleMapsCoordinates } from "../types/googleMaps";
import type { CurrentLocationState } from "../types/location";
import { calculateDistanceMeters } from "../utils/location";
import { normalizeHeading } from "../utils/mapHeading";
import { MapPlaceholder } from "./MapPlaceholder";

type GoogleMapViewProps = {
  locationState: CurrentLocationState;
  zoom: number;
  interactive?: boolean;
  fullMap?: boolean;
  variant?: "panel" | "background";
  className?: string;
  heading?: number | null;
  orientationMode?: MapOrientationMode;
  appPosition?: GoogleMapsCoordinates | null;
  showGpsMarker?: boolean;
};

export function GoogleMapView({
  locationState,
  zoom,
  interactive = true,
  fullMap = false,
  variant = "panel",
  className = "",
  heading = null,
  orientationMode = "north-up",
  appPosition = null,
  showGpsMarker = false,
}: GoogleMapViewProps) {
  const initialMapsStatus = useMemo(() => getGoogleMapsLoadStatus(), []);
  const [mapsStatus, setMapsStatus] = useState(initialMapsStatus);
  const [isVectorMap, setIsVectorMap] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const gpsMarkerRef = useRef<google.maps.Marker | null>(null);
  const appMarkerRef = useRef<google.maps.Marker | null>(null);
  const headingMarkerRef = useRef<google.maps.Marker | null>(null);
  const normalizedHeading = normalizeHeading(heading);
  const googleMapsMapId = getGoogleMapsMapId();
  const hasMapId = Boolean(googleMapsMapId);

  const gpsCenter =
    locationState.status === "success"
      ? {
          lat: locationState.latitude,
          lng: locationState.longitude,
        }
      : null;

  const focusCenter = appPosition
    ? {
        lat: appPosition.latitude,
        lng: appPosition.longitude,
      }
    : gpsCenter;

  useEffect(() => {
    let cancelled = false;

    if (mapsStatus.status === "missing-api-key" || !focusCenter) {
      return () => {
        cancelled = true;
      };
    }

    void loadGoogleMapsApi().then((result) => {
      if (cancelled) {
        return;
      }

      setMapsStatus(result);

      if (result.status !== "loaded" || !mapElementRef.current) {
        return;
      }

      if (!mapInstanceRef.current) {
        const options: google.maps.MapOptions = {
          center: focusCenter,
          zoom,
          disableDefaultUI: true,
          clickableIcons: interactive,
          gestureHandling: interactive ? "greedy" : "none",
          keyboardShortcuts: interactive,
          zoomControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        };

        if (hasMapId) {
          options.mapId = googleMapsMapId ?? undefined;
          options.renderingType = google.maps.RenderingType.VECTOR;
        }

        mapInstanceRef.current = new google.maps.Map(mapElementRef.current, options);

        google.maps.event.addListenerOnce(mapInstanceRef.current, "idle", () => {
          const map = mapInstanceRef.current;
          if (!map || cancelled) {
            return;
          }

          const renderingType = map.getRenderingType?.() ?? null;
          setIsVectorMap(hasMapId && renderingType === google.maps.RenderingType.VECTOR);
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [focusCenter, googleMapsMapId, hasMapId, interactive, mapsStatus.status, zoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !focusCenter) {
      return;
    }

    map.setCenter(focusCenter);
    map.setZoom(zoom);

    if (gpsCenter && showGpsMarker && !appPositionIsNearGps(appPosition, locationState)) {
      if (!gpsMarkerRef.current) {
        gpsMarkerRef.current = new google.maps.Marker({
          map,
          clickable: false,
          zIndex: 2,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#7ac4ff",
            fillOpacity: 1,
            strokeColor: "#0f2742",
            strokeOpacity: 0.95,
            strokeWeight: 2,
            scale: 6,
          },
        });
      }

      gpsMarkerRef.current.setMap(map);
      gpsMarkerRef.current.setPosition(gpsCenter);
    } else if (gpsMarkerRef.current) {
      gpsMarkerRef.current.setMap(null);
    }

    if (!appMarkerRef.current) {
      appMarkerRef.current = new google.maps.Marker({
        map,
        clickable: false,
        zIndex: 3,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#5fe3a2",
          fillOpacity: 1,
          strokeColor: "#0d1419",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          scale: 8,
        },
      });
    }

    appMarkerRef.current.setMap(map);
    appMarkerRef.current.setPosition(focusCenter);

    if (normalizedHeading !== null) {
      if (!headingMarkerRef.current) {
        headingMarkerRef.current = new google.maps.Marker({
          map,
          clickable: false,
          zIndex: 4,
        });
      }

      const markerRotation =
        orientationMode === "heading-up" && isVectorMap ? 0 : normalizedHeading;

      headingMarkerRef.current.setMap(map);
      headingMarkerRef.current.setPosition(focusCenter);
      headingMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: "#ffd166",
        fillOpacity: 1,
        strokeColor: "#7a4f00",
        strokeOpacity: 0.95,
        strokeWeight: 1.5,
        scale: 6,
        rotation: markerRotation,
        anchor: new google.maps.Point(0, 3.4),
      });
    } else if (headingMarkerRef.current) {
      headingMarkerRef.current.setMap(null);
    }
  }, [
    appPosition,
    focusCenter,
    gpsCenter,
    isVectorMap,
    locationState,
    normalizedHeading,
    orientationMode,
    showGpsMarker,
    zoom,
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    const renderingType = map.getRenderingType?.() ?? null;
    const vectorEnabled = hasMapId && renderingType === google.maps.RenderingType.VECTOR;
    const appliedHeading =
      orientationMode === "heading-up" && normalizedHeading !== null && vectorEnabled
        ? normalizedHeading
        : 0;

    setIsVectorMap(vectorEnabled);
    map.setHeading(appliedHeading);
  }, [hasMapId, normalizedHeading, orientationMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || typeof window === "undefined") {
      return;
    }

    window.google?.maps?.event.trigger(map, "resize");
    if (focusCenter) {
      map.setCenter(focusCenter);
    }
  }, [focusCenter, fullMap]);

  if (mapsStatus.status === "missing-api-key") {
    return <MapPlaceholder fullMap={fullMap} message="Google Maps の設定を追加すると地図を表示できます。" />;
  }

  if (mapsStatus.status === "load-error") {
    return <MapPlaceholder fullMap={fullMap} message={mapsStatus.message} />;
  }

  if (locationState.status !== "success") {
    return <MapPlaceholder fullMap={fullMap} message="位置情報を取得すると地図を表示できます。" tone="neutral" />;
  }

  return (
    <div
      className={`google-map-view google-map-view--${variant} ${fullMap ? "google-map-view--full" : ""} ${className}`.trim()}
    >
      <div ref={mapElementRef} className="google-map-view__canvas" />
      {orientationMode === "heading-up" && !isVectorMap ? (
        <div className="map-floating-note">この端末では北固定で表示しています。</div>
      ) : null}
    </div>
  );
}

function appPositionIsNearGps(
  appPosition: GoogleMapsCoordinates | null,
  locationState: CurrentLocationState,
) {
  if (!appPosition || locationState.status !== "success") {
    return true;
  }

  const distance = calculateDistanceMeters(
    locationState.latitude,
    locationState.longitude,
    appPosition.latitude,
    appPosition.longitude,
  );

  return distance < 3;
}
