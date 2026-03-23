type ApiStatusNoticeProps = {
  tone?: "neutral" | "warning" | "ready";
  title: string;
  message: string;
};

export function ApiStatusNotice({
  tone = "neutral",
  title,
  message,
}: ApiStatusNoticeProps) {
  return (
    <div className={`api-status-notice api-status-notice--${tone}`} role="status">
      <div className="api-status-notice__title">{title}</div>
      <div className="api-status-notice__message">{message}</div>
    </div>
  );
}
