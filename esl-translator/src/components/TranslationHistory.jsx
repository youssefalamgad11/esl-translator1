function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** List of previous translations. Clicking an item translates it again. */
export default function TranslationHistory({ items, onSelect, onClear }) {
  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="panel-head">
        <h2 id="history-title">سجل الترجمة</h2>
        {items.length > 0 && (
          <button type="button" className="btn btn-ghost btn-small" onClick={onClear}>
            مسح السجل
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="muted">لا توجد ترجمات سابقة بعد.</p>
      ) : (
        <ul className="history-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="history-item" onClick={() => onSelect(item)}>
                <span className="history-text">{item.text}</span>
                <span className="history-meta">
                  {formatTime(item.at)} · {item.matched}/{item.total} كلمة
                  {item.missing > 0 && <span className="history-warn"> · ⚠ كلمات بدون إشارة</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
