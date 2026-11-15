import { useCallback, useEffect, useState } from 'react';
import Microphone from './components/Microphone.jsx';
import TextDisplay from './components/TextDisplay.jsx';
import SignPlayer from './components/SignPlayer.jsx';
import TranslationResult from './components/TranslationResult.jsx';
import TranslationHistory from './components/TranslationHistory.jsx';
import signsData from './data/signs.json';
import { createTranslator } from './utils/signTranslator.js';

const translator = createTranslator(signsData);
const hasPlaceholders = signsData.signs.some((sign) => sign.status !== 'verified');

const HISTORY_KEY = 'esl-translation-history-v1';
const MAX_HISTORY = 20;

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode, quota) - history just won't persist */
  }
}

const joinText = (a, b) => [a, b].filter(Boolean).join(' ');

export default function App() {
  const [text, setText] = useState('');
  const [baseText, setBaseText] = useState(''); // text that existed before the current recording
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const translate = useCallback((input) => {
    const next = translator.translate(input);
    setResult(next);
    setRunKey((key) => key + 1);

    if (next.status !== 'empty') {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: input.trim(),
        at: Date.now(),
        matched: next.matched,
        total: next.total,
        missing: next.missing.length,
      };
      setHistory((prev) => [entry, ...prev.filter((item) => item.text !== entry.text)].slice(0, MAX_HISTORY));
    }
  }, []);

  // Recording keeps appending to whatever text was already in the box.
  function handleSessionStart() {
    setBaseText(text.trim());
    setRecording(true);
  }

  function handleSessionText(sessionText) {
    setText(joinText(baseText, sessionText));
  }

  function handleSessionEnd(sessionText) {
    setRecording(false);
    if (!sessionText) return;
    const full = joinText(baseText, sessionText);
    setText(full);
    translate(full);
  }

  function handleSelectHistory(item) {
    setText(item.text);
    translate(item.text);
  }

  function handleClear() {
    setText('');
    setResult(null);
    setRunKey((key) => key + 1);
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        تخطي إلى المحتوى
      </a>

      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            🤟
          </span>
          <div>
            <h1>مترجم لغة الإشارة المصرية</h1>
            <p>تحدّث بالعربية المصرية أو اكتب نصًا، وشاهد الإشارات المقابلة له</p>
          </div>
        </div>
        <span className="badge">نسخة MVP</span>
      </header>

      {hasPlaceholders && (
        <div className="banner" role="note">
          <strong>تنبيه:</strong> الفيديوهات الحالية ملفات تجريبية (Placeholders) وليست ترجمة حقيقية بلغة الإشارة
          المصرية. استبدلها بفيديوهات معتمدة قبل الاستخدام الفعلي.
        </div>
      )}

      <main id="main" className="layout">
        <div className="area-input">
          <Microphone
            onSessionStart={handleSessionStart}
            onSessionText={handleSessionText}
            onSessionEnd={handleSessionEnd}
          />
          <TextDisplay
            text={text}
            onChange={setText}
            onTranslate={() => translate(text)}
            onClear={handleClear}
            listening={recording}
          />
        </div>

        <div className="area-player">
          <SignPlayer playlist={result ? result.playlist : []} runKey={runKey} />
        </div>

        <div className="area-result">
          <TranslationResult result={result} />
        </div>

        <div className="area-history">
          <TranslationHistory items={history} onSelect={handleSelectHistory} onClear={() => setHistory([])} />
        </div>
      </main>

      <footer className="app-footer">
        <p>
          تعمل الصفحة بالكامل داخل المتصفح بدون خادم خاص بنا. ملاحظة: التعرف على الصوت في Chrome تنفّذه خدمة
          المتصفح عبر الإنترنت، لذلك يُرسَل الصوت إلى مزوّد الخدمة (Google) لتحويله إلى نص.
        </p>
      </footer>
    </div>
  );
}
