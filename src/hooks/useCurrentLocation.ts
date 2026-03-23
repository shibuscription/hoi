import { useEffect, useState } from "react";
import type { CurrentLocationState } from "../types/location";

const initialLocationState: CurrentLocationState = {
  status: "idle",
  latitude: null,
  longitude: null,
  accuracy: null,
  errorMessage: null,
};

let sharedLocationState: CurrentLocationState = initialLocationState;
let inFlightRequest: Promise<CurrentLocationState> | null = null;
const listeners = new Set<(state: CurrentLocationState) => void>();

function notifyLocationState(nextState: CurrentLocationState) {
  sharedLocationState = nextState;
  listeners.forEach((listener) => listener(sharedLocationState));
}

function buildGeolocationErrorState(error: GeolocationPositionError): CurrentLocationState {
  if (error.code === error.PERMISSION_DENIED) {
    return {
      status: "permission-denied",
      latitude: null,
      longitude: null,
      accuracy: null,
      errorMessage: "位置情報の利用が許可されていません。",
    };
  }

  return {
    status: "error",
    latitude: null,
    longitude: null,
    accuracy: null,
    errorMessage:
      error.code === error.TIMEOUT
        ? "位置情報の取得がタイムアウトしました。"
        : "位置情報を取得できませんでした。",
  };
}

export function requestCurrentLocation(force = false): Promise<CurrentLocationState> {
  if (typeof window === "undefined") {
    return Promise.resolve(sharedLocationState);
  }

  if (!("geolocation" in navigator)) {
    const nextState: CurrentLocationState = {
      status: "error",
      latitude: null,
      longitude: null,
      accuracy: null,
      errorMessage: "このブラウザでは位置情報を利用できません。",
    };
    notifyLocationState(nextState);
    return Promise.resolve(nextState);
  }

  if (!force && sharedLocationState.status === "success") {
    return Promise.resolve(sharedLocationState);
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  notifyLocationState({
    status: "loading",
    latitude: null,
    longitude: null,
    accuracy: null,
    errorMessage: null,
  });

  inFlightRequest = new Promise<CurrentLocationState>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextState: CurrentLocationState = {
          status: "success",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          errorMessage: null,
        };
        notifyLocationState(nextState);
        inFlightRequest = null;
        resolve(nextState);
      },
      (error) => {
        const nextState = buildGeolocationErrorState(error);
        notifyLocationState(nextState);
        inFlightRequest = null;
        resolve(nextState);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: force ? 0 : 30000,
      },
    );
  });

  return inFlightRequest;
}

export function useCurrentLocation() {
  const [locationState, setLocationState] = useState<CurrentLocationState>(sharedLocationState);

  useEffect(() => {
    listeners.add(setLocationState);
    setLocationState(sharedLocationState);
    void requestCurrentLocation();

    return () => {
      listeners.delete(setLocationState);
    };
  }, []);

  return {
    locationState,
    retryLocationRequest: () => requestCurrentLocation(true),
    refreshLocationRequest: () => requestCurrentLocation(true),
  };
}
