export type CameraStatus =
  | "idle"
  | "loading"
  | "ready"
  | "permission-denied"
  | "unsupported"
  | "error";

export type CameraState = {
  status: CameraStatus;
  errorMessage: string | null;
  capturedImageDataUrl: string | null;
};
