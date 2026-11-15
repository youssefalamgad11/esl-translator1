/**
 * Shows the recognized Arabic text. The user can edit it freely
 * (it becomes read-only only while a recording is running).
 */
export default function TextDisplay({ text, onChange, onTranslate, onClear, listening }) {
  const isEmpty = text.trim().length === 0;

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !isEmpty && !listening) {
      event.preventDefault();
      onTranslate();
    }
  }

  return (
    <section className="panel text-panel" aria-labelledby="text-title">
      <div className="panel-head">
        <h2 id="text-title">النص العربي</h2>
        {listening && <span className="live-tag">يتم التسجيل الآن</span>}
      </div>

      <label className="field-label" htmlFor="recognized-text">
        النص الذي تم التعرف عليه — يمكنك تعديله أو كتابته يدويًا
      </label>
      <textarea
        id="recognized-text"
        className="text-area"
        dir="rtl"
        lang="ar-EG"
        rows={4}
        value={text}
        readOnly={listening}
        placeholder="مثال: أنا بحبك"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onTranslate} disabled={isEmpty || listening}>
          ترجم إلى لغة الإشارة
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={isEmpty || listening}>
          مسح النص
        </button>
      </div>
      <p className="hint">اختصار: Ctrl + Enter للترجمة. تتم الترجمة تلقائيًا عند إيقاف التسجيل.</p>
    </section>
  );
}
