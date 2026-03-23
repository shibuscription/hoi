import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraState } from "../types/camera";

const initialCameraState: CameraState = {
  status: "idle",
  errorMessage: null,
  capturedImageDataUrl: null,
};

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function getCameraErrorMessage(error: unknown): {
  status: CameraState["status"];
  message: string;
} {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return {
        status: "permission-denied",
        message: "カメラの利用が許可されていません",
      };
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        status: "error",
        message: "利用できるカメラが見つかりませんでした",
      };
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return {
        status: "error",
        message: "カメラを起動できませんでした",
      };
    }

    if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
      return {
        status: "error",
        message: "この端末で希望するカメラ条件を満たせませんでした",
      };
    }
  }

  return {
    status: "error",
    message: "カメラを起動できませんでした",
  };
}

export function useCamera(enabled: boolean) {
  const [cameraState, setCameraState] = useState<CameraState>(initialCameraState);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startAttemptRef = useRef(0);

  const stopCamera = useCallback(() => {
    const currentVideo = videoRef.current;

    if (currentVideo) {
      currentVideo.pause();
      currentVideo.srcObject = null;
    }

    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState((current) => ({
        ...current,
        status: "unsupported",
        errorMessage: "この環境ではカメラ機能を利用できません",
      }));
      return;
    }

    const attemptId = startAttemptRef.current + 1;
    startAttemptRef.current = attemptId;

    setCameraState((current) => ({
      ...current,
      status: "loading",
      errorMessage: null,
    }));

    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (startAttemptRef.current !== attemptId) {
        stopMediaStream(stream);
        return;
      }

      streamRef.current = stream;

      const currentVideo = videoRef.current;
      if (currentVideo) {
        currentVideo.srcObject = stream;
        currentVideo.playsInline = true;
        currentVideo.muted = true;

        try {
          await currentVideo.play();
        } catch {
          // `play()` can reject during transient browser conditions; keep the stream attached.
        }
      }

      setCameraState((current) => ({
        ...current,
        status: "ready",
        errorMessage: null,
      }));
    } catch (error: unknown) {
      const cameraError = getCameraErrorMessage(error);

      setCameraState((current) => ({
        ...current,
        status: cameraError.status,
        errorMessage: cameraError.message,
      }));
    }
  }, [stopCamera]);

  const captureFrame = useCallback(() => {
    const currentVideo = videoRef.current;

    if (!currentVideo || currentVideo.videoWidth === 0 || currentVideo.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = currentVideo.videoWidth;
    canvas.height = currentVideo.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setCameraState((current) => ({
      ...current,
      capturedImageDataUrl: imageDataUrl,
    }));

    return imageDataUrl;
  }, []);

  const clearCapturedImage = useCallback(() => {
    setCameraState((current) => ({
      ...current,
      capturedImageDataUrl: null,
    }));
  }, []);

  useEffect(() => {
    if (enabled) {
      void startCamera();
    } else {
      stopCamera();
      setCameraState((current) => ({
        ...current,
        status: "idle",
        errorMessage: null,
      }));
    }

    return () => {
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  return {
    cameraState,
    videoRef,
    captureFrame,
    retryCamera: startCamera,
    stopCamera,
    clearCapturedImage,
  };
}
