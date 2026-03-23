import { ApiStatusNotice } from "./ApiStatusNotice";
import type { CameraState } from "../types/camera";

type CameraPreviewProps = {
  cameraState: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  capturedImageDataUrl?: string | null;
  mode: "live" | "captured";
};

export function CameraPreview({
  cameraState,
  videoRef,
  capturedImageDataUrl = null,
  mode,
}: CameraPreviewProps) {
  const isLive = mode === "live";

  return (
    <div className={`camera-mock ${!isLive ? "camera-mock--captured" : ""}`}>
      {isLive ? (
        <>
          <video ref={videoRef} className="camera-video" autoPlay muted playsInline />

          {cameraState.status === "loading" ? (
            <div className="camera-overlay-message camera-overlay-message--compact">
              <ApiStatusNotice tone="neutral" title="カメラを起動中…" message="" />
            </div>
          ) : null}

          {(cameraState.status === "permission-denied" ||
            cameraState.status === "unsupported" ||
            cameraState.status === "error") && (
            <div className="camera-overlay-message">
              <ApiStatusNotice
                tone="warning"
                title={
                  cameraState.status === "permission-denied"
                    ? "カメラを利用できません"
                    : cameraState.status === "unsupported"
                      ? "この端末ではカメラを利用できません"
                      : "カメラを起動できませんでした"
                }
                message={cameraState.errorMessage ?? "カメラ設定を確認して、もう一度お試しください。"}
              />
            </div>
          )}
        </>
      ) : capturedImageDataUrl ? (
        <img alt="撮影した景色" className="captured-image" src={capturedImageDataUrl} />
      ) : (
        <div className="camera-overlay-message">
          <ApiStatusNotice
            tone="warning"
            title="写真がありません"
            message="もう一度撮影してください。"
          />
        </div>
      )}
    </div>
  );
}
