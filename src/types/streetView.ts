export type StreetViewConfidenceLevel = "high" | "medium" | "low";

export type StreetViewState =
  | {
      status: "idle" | "loading";
      panoramaLocationLat: null;
      panoramaLocationLng: null;
      panoId: null;
      distanceMeters: null;
      confidenceLevel: null;
      errorMessage: null;
    }
  | {
      status: "success";
      panoramaLocationLat: number;
      panoramaLocationLng: number;
      panoId: string | null;
      distanceMeters: number;
      confidenceLevel: StreetViewConfidenceLevel;
      errorMessage: null;
    }
  | {
      status: "missing-api-key" | "not-found" | "error";
      panoramaLocationLat: null;
      panoramaLocationLng: null;
      panoId: null;
      distanceMeters: null;
      confidenceLevel: null;
      errorMessage: string;
    };
