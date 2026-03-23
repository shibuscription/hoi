export type LocationStatus =
  | "idle"
  | "loading"
  | "success"
  | "permission-denied"
  | "error";

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type CurrentLocationState =
  | {
      status: "idle" | "loading";
      latitude: null;
      longitude: null;
      accuracy: null;
      errorMessage: null;
    }
  | {
      status: "success";
      latitude: number;
      longitude: number;
      accuracy: number | null;
      errorMessage: null;
    }
  | {
      status: "permission-denied" | "error";
      latitude: null;
      longitude: null;
      accuracy: null;
      errorMessage: string;
    };
