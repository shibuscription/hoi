import { Loader } from "@googlemaps/js-api-loader";
import { getGoogleMapsApiKey } from "../config/env";

export type GoogleMapsLoadStatus =
  | "missing-api-key"
  | "ready-to-load"
  | "loaded"
  | "load-error";

export type GoogleMapsLoadResult = {
  status: GoogleMapsLoadStatus;
  message: string;
};

let loader: Loader | null = null;
let loadPromise: Promise<GoogleMapsLoadResult> | null = null;

export function getGoogleMapsLoadStatus(): GoogleMapsLoadResult {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return {
      status: "missing-api-key",
      message: "Google Maps API キー未設定",
    };
  }

  return {
    status: "ready-to-load",
    message: "Google Maps API 読み込み準備済み",
  };
}

export async function loadGoogleMapsApi(): Promise<GoogleMapsLoadResult> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return {
      status: "missing-api-key",
      message: "Google Maps API キー未設定",
    };
  }

  if (typeof window === "undefined") {
    return {
      status: "load-error",
      message: "ブラウザ環境でのみ Google Maps API を読み込めます",
    };
  }

  if (!loader) {
    loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["maps", "streetView"],
      language: "ja",
      region: "JP",
    });
  }

  if (!loadPromise) {
    loadPromise = loader
      .load()
      .then(() => ({
        status: "loaded" as const,
        message: "Google Maps API 読み込み済み",
      }))
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Google Maps API の読み込みに失敗しました";

        loadPromise = null;

        return {
          status: "load-error" as const,
          message,
        };
      });
  }

  return loadPromise;
}
