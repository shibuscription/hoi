type GoogleMapsActionButtonsProps = {
  mapUrl: string | null;
  streetViewUrl: string | null;
};

export function GoogleMapsActionButtons({
  mapUrl,
  streetViewUrl,
}: GoogleMapsActionButtonsProps) {
  return (
    <section className="external-map-panel" aria-label="Googleマップ連携">
      <div className="external-map-panel__header">
        <div className="external-map-panel__title">Googleマップで続ける</div>
        <div className="external-map-panel__caption">向き合わせ後の確認や移動を引き継ぎます</div>
      </div>

      <div className="external-map-actions">
        {mapUrl ? (
          <a
            className="external-map-link"
            href={mapUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>地図で開く</span>
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <button className="external-map-link external-map-link--disabled" disabled type="button">
            <span>地図で開く</span>
            <span aria-hidden="true">↗</span>
          </button>
        )}

        {streetViewUrl ? (
          <a
            className="external-map-link"
            href={streetViewUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>この向きの景色で開く</span>
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <button className="external-map-link external-map-link--disabled" disabled type="button">
            <span>この向きの景色で開く</span>
            <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
    </section>
  );
}
