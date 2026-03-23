import type { ReactNode } from "react";

type MapOverlayIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string | null;
  onClick?: () => void;
  title?: string;
};

export function MapOverlayIconButton({
  ariaLabel,
  children,
  className = "",
  disabled = false,
  href,
  onClick,
  title,
}: MapOverlayIconButtonProps) {
  const classes = `map-overlay-icon-button ${disabled ? "map-overlay-icon-button--disabled" : ""} ${className}`.trim();

  if (href && !disabled) {
    return (
      <a
        aria-label={ariaLabel}
        className={classes}
        href={href}
        rel="noreferrer"
        target="_blank"
        title={title ?? ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      aria-label={ariaLabel}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={title ?? ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
}
