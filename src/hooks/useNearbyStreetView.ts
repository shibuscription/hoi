import { useEffect, useState } from "react";
import { STREET_VIEW_SEARCH_RADIUS_METERS } from "../constants/streetView";
import { getGoogleMapsLoadStatus, loadGoogleMapsApi } from "../lib/googleMaps";
import type { CurrentLocationState } from "../types/location";
import type { StreetViewState } from "../types/streetView";
import { calculateDistanceMeters, getStreetViewConfidenceLevel } from "../utils/location";

const initialStreetViewState: StreetViewState = {
  status: "idle",
  panoramaLocationLat: null,
  panoramaLocationLng: null,
  panoId: null,
  distanceMeters: null,
  confidenceLevel: null,
  errorMessage: null,
};

export function useNearbyStreetView(enabled: boolean, locationState: CurrentLocationState) {
  const [streetViewState, setStreetViewState] =
    useState<StreetViewState>(initialStreetViewState);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setStreetViewState(initialStreetViewState);
      return () => {
        cancelled = true;
      };
    }

    const mapsStatus = getGoogleMapsLoadStatus();

    if (mapsStatus.status === "missing-api-key") {
      setStreetViewState({
        status: "missing-api-key",
        panoramaLocationLat: null,
        panoramaLocationLng: null,
        panoId: null,
        distanceMeters: null,
        confidenceLevel: null,
        errorMessage: "Google Maps APIキー未設定のため Street View を取得できません",
      });
      return () => {
        cancelled = true;
      };
    }

    if (locationState.status !== "success") {
      setStreetViewState(initialStreetViewState);
      return () => {
        cancelled = true;
      };
    }

    setStreetViewState({
      status: "loading",
      panoramaLocationLat: null,
      panoramaLocationLng: null,
      panoId: null,
      distanceMeters: null,
      confidenceLevel: null,
      errorMessage: null,
    });

    loadGoogleMapsApi().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.status !== "loaded") {
        setStreetViewState({
          status: "error",
          panoramaLocationLat: null,
          panoramaLocationLng: null,
          panoId: null,
          distanceMeters: null,
          confidenceLevel: null,
          errorMessage: result.message,
        });
        return;
      }

      const service = new google.maps.StreetViewService();
      const currentLocation = {
        lat: locationState.latitude,
        lng: locationState.longitude,
      };

      service.getPanorama(
        {
          location: currentLocation,
          radius: STREET_VIEW_SEARCH_RADIUS_METERS,
          preference: google.maps.StreetViewPreference.NEAREST,
        },
        (data, status) => {
          if (cancelled) {
            return;
          }

          if (status !== google.maps.StreetViewStatus.OK || !data?.location?.latLng) {
            setStreetViewState({
              status: "not-found",
              panoramaLocationLat: null,
              panoramaLocationLng: null,
              panoId: null,
              distanceMeters: null,
              confidenceLevel: null,
              errorMessage: "この場所では景色を取得できませんでした",
            });
            return;
          }

          const panoramaLat = data.location.latLng.lat();
          const panoramaLng = data.location.latLng.lng();
          const distanceMeters = calculateDistanceMeters(
            locationState.latitude,
            locationState.longitude,
            panoramaLat,
            panoramaLng,
          );

          setStreetViewState({
            status: "success",
            panoramaLocationLat: panoramaLat,
            panoramaLocationLng: panoramaLng,
            panoId: data.location.pano ?? null,
            distanceMeters,
            confidenceLevel: getStreetViewConfidenceLevel(distanceMeters),
            errorMessage: null,
          });
        },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, locationState]);

  return {
    streetViewState,
  };
}
