/**
 * Shows how the text was split into signs, and clearly warns about every
 * word that has no sign in the dictionary (those words are NOT translated).
 */
export default function TranslationResult({ result }) {
  if (!result || result.status === 'empty') {
    return (
      <section className="panel" aria-labelledby="result-title">
        <div className="panel-head">
          <h2 id="result-title">نتيجة الترجمة</h2>
        </div>
        <p className="muted">ستظهر هنا نتيجة الترجمة بعد الضغط على «ترجم إلى لغة الإشارة».</p>
      </section>
    );
  }

  const { segments, missing, matched, total, status } = result;

  return (
    <section className="panel" aria-labelledby="result-title">
      <div className="panel-head">
        <h2 id="result-title">نتيجة الترجمة</h2>
        <span className={`counter ${status === 'full' ? 'counter-ok' : ''}`}>
          تمت ترجمة {matched} من {total} {total === 1 ? 'كلمة' : 'كلمات'}
        </span>
      </div>

      {status === 'none' && (
        <p className="notice notice-error" role="alert">
          <strong>لا توجد ترجمة:</strong> لم يتم العثور على أي إشارة مطابقة لهذا النص في القاموس الحالي.
        </p>
      )}

      {status === 'partial' && (
        <div className="notice notice-warn" role="alert">
          <p>
            <strong>تنبيه — ترجمة جزئية:</strong> لا توجد إشارة مسجّلة للكلمات التالية، لذلك لم تتم ترجمتها ولن
            يُعرض لها أي فيديو:
          </p>
          <ul className="missing-list">
            {missing.map((word, i) => (
              <li key={`${word}-${i}`}>{word}</li>
            ))}
          </ul>
        </div>
      )}

      {status === 'none' && missing.length > 0 && (
        <ul className="missing-list" aria-label="كلمات بدون إشارة">
          {missing.map((word, i) => (
            <li key={`${word}-${i}`}>{word}</li>
          ))}
        </ul>
      )}

      <ol className="segments" aria-label="تقسيم الجملة إلى إشارات">
        {segments.map((segment, i) => (
          <li key={`${segment.text}-${i}`} className={`chip ${segment.kind === 'sign' ? 'chip-sign' : 'chip-missing'}`}>
            <span aria-hidden="true">{segment.kind === 'sign' ? '✓' : '⚠'}</span>
            <span>{segment.text}</span>
            <span className="sr-only">{segment.kind === 'sign' ? ' — توجد إشارة' : ' — لا توجد إشارة'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
