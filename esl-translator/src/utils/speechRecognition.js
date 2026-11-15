/**
 * Thin wrapper around the browser Web Speech API (SpeechRecognition).
 * Works in Chrome / Edge (webkitSpeechRecognition). Not available in Firefox.
 */

export const SPEECH_LANG = 'ar-EG';

export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionConstructor() !== null;
}

/** Arabic, user-facing explanation for a SpeechRecognition error code. */
export function describeSpeechError(code) {
  switch (code) {
    case 'not-allowed':
      return 'تم رفض إذن الميكروفون. اسمح للموقع باستخدام الميكروفون من إعدادات المتصفح (أيقونة القفل بجوار الرابط) ثم أعد المحاولة.';
    case 'service-not-allowed':
      return 'خدمة التعرف على الصوت غير مسموح بها في هذا المتصفح أو في هذه الصفحة.';
    case 'audio-capture':
      return 'لم يتم العثور على ميكروفون. تأكد من توصيله وتفعيله ثم أعد المحاولة.';
    case 'no-speech':
      return 'لم يتم التقاط أي كلام. حاول مرة أخرى وتحدّث بوضوح قرب الميكروفون.';
    case 'network':
      return 'تعذّر الاتصال بخدمة التعرف على الصوت. تحقق من اتصال الإنترنت (يعتمد التعرف على الصوت في Chrome على الإنترنت).';
    case 'language-not-supported':
      return 'اللغة العربية (مصر) غير مدعومة في هذا المتصفح.';
    case 'aborted':
      return '';
    default:
      return `حدث خطأ غير متوقع في التعرف على الصوت (${code}).`;
  }
}

/**
 * Create a recognizer. Returns null when the browser has no support.
 *
 * Callbacks:
 *  onStart()                       recognition really started (mic is live)
 *  onResult({ text, isFinal })     text of the CURRENT session so far (final + interim)
 *  onError(code, message)          Arabic message ready for display ('aborted' is not reported)
 *  onEnd(text)                     session finished; text = everything heard in this session
 */
export function createSpeechRecognizer({ lang = SPEECH_LANG, onStart, onResult, onError, onEnd } = {}) {
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) return null;

  let recognition = null;
  let sessionText = '';

  const clean = (s) => s.replace(/\s+/g, ' ').trim();

  function start() {
    if (recognition) return; // already running
    sessionText = '';

    const rec = new Recognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => onStart?.();

    rec.onresult = (event) => {
      let finalPart = '';
      let interimPart = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) finalPart += ` ${transcript}`;
        else interimPart += ` ${transcript}`;
      }
      sessionText = clean(`${finalPart} ${interimPart}`);
      onResult?.({ text: sessionText, isFinal: interimPart.trim() === '' });
    };

    rec.onerror = (event) => {
      if (event.error === 'aborted') return;
      onError?.(event.error, describeSpeechError(event.error));
    };

    rec.onend = () => {
      recognition = null;
      onEnd?.(sessionText);
    };

    recognition = rec;
    try {
      rec.start();
    } catch (err) {
      recognition = null;
      onError?.('start-failed', describeSpeechError('start-failed'));
      onEnd?.('');
    }
  }

  function stop() {
    recognition?.stop(); // delivers pending final results, then fires onend
  }

  function abort() {
    if (!recognition) return;
    const rec = recognition;
    recognition = null;
    rec.onend = null;
    rec.onresult = null;
    rec.onerror = null;
    try {
      rec.abort();
    } catch {
      /* ignore */
    }
  }

  return { start, stop, abort };
}
