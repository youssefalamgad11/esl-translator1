import { useEffect, useRef, useState } from 'react';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  SPEECH_LANG,
} from '../utils/speechRecognition.js';

const STATUS_TEXT = {
  idle: 'اضغط على الميكروفون ثم ابدأ الكلام',
  starting: 'جارٍ تشغيل الميكروفون… اسمح بالوصول إذا طلب المتصفح ذلك',
  listening: 'جارٍ التسجيل — تحدّث بالعربية المصرية، واضغط مرة أخرى للإيقاف',
};

/**
 * Microphone button + recording status.
 * The component owns the recognizer; the parent just receives text through callbacks:
 *   onSessionStart()        a new recording session began
 *   onSessionText(text)     text heard so far in this session (final + interim)
 *   onSessionEnd(text)      the session ended with this text
 */
export default function Microphone({ onSessionStart, onSessionText, onSessionEnd }) {
  const supported = isSpeechRecognitionSupported();
  const insecure = typeof window !== 'undefined' && window.isSecureContext === false;

  const [status, setStatus] = useState('idle'); // idle | starting | listening
  const [error, setError] = useState('');

  // Always call the latest callbacks without recreating the recognizer.
  const handlers = useRef({});
  handlers.current = { onSessionStart, onSessionText, onSessionEnd };
  const recognizerRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    const recognizer = createSpeechRecognizer({
      lang: SPEECH_LANG,
      onStart: () => {
        if (disposed) return;
        setStatus('listening');
        handlers.current.onSessionStart?.();
      },
      onResult: ({ text }) => {
        if (disposed) return;
        handlers.current.onSessionText?.(text);
      },
      onError: (_code, message) => {
        if (disposed) return;
        if (message) setError(message);
      },
      onEnd: (text) => {
        if (disposed) return;
        setStatus('idle');
        handlers.current.onSessionEnd?.(text);
      },
    });

    recognizerRef.current = recognizer;
    return () => {
      disposed = true;
      recognizer?.abort();
      recognizerRef.current = null;
    };
  }, []);

  const active = status !== 'idle';

  function toggle() {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;
    if (active) {
      recognizer.stop();
      return;
    }
    setError('');
    setStatus('starting');
    recognizer.start();
  }

  return (
    <section className="panel mic-panel" aria-labelledby="mic-title">
      <div className="panel-head">
        <h2 id="mic-title">التسجيل الصوتي</h2>
        <span className="lang-tag" lang="en" dir="ltr">
          {SPEECH_LANG}
        </span>
      </div>

      <div className="mic-body">
        <button
          type="button"
          className={`mic-btn ${active ? 'is-active' : ''}`}
          onClick={toggle}
          disabled={!supported}
          aria-pressed={active}
          aria-describedby="mic-status"
          aria-label={active ? 'إيقاف التسجيل' : 'بدء التسجيل'}
        >
          <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true" focusable="false">
            {active ? (
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            ) : (
              <path
                fill="currentColor"
                d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"
              />
            )}
          </svg>
        </button>

        <div className="mic-info">
          <p className="mic-action">{active ? 'إيقاف التسجيل' : 'بدء التسجيل'}</p>
          <p id="mic-status" className={`status status-${status}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {supported ? STATUS_TEXT[status] : 'التسجيل الصوتي غير متاح في هذا المتصفح'}
          </p>
        </div>
      </div>

      {!supported && (
        <p className="notice notice-warn" role="alert">
          هذا المتصفح لا يدعم التعرف على الصوت. استخدم Google Chrome على الكمبيوتر أو الأندرويد، أو اكتب
          النص يدويًا في الحقل أدناه.
        </p>
      )}

      {supported && insecure && (
        <p className="notice notice-warn" role="alert">
          الميكروفون يحتاج إلى اتصال آمن (HTTPS). افتح الموقع عبر رابط https أو localhost.
        </p>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
