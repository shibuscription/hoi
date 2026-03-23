import { ApiStatusNotice } from "./ApiStatusNotice";

type MapPlaceholderProps = {
  fullMap?: boolean;
  message: string;
  tone?: "neutral" | "warning" | "ready";
};

export function MapPlaceholder({
  fullMap = false,
  message,
  tone = "warning",
}: MapPlaceholderProps) {
  return (
    <div className={`map-mock ${fullMap ? "map-mock--full" : ""}`}>
      <div className="map-pattern" />
      <div className="map-routes" />
      <div className="map-dev-status map-dev-status--centered">
        <ApiStatusNotice tone={tone} title={message} message="" />
      </div>
    </div>
  );
}
