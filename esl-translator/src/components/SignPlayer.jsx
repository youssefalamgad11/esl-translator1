import { useEffect, useRef, useState } from 'react';

/** Build the URL of a sign video. Files live in public/signs/. */
function signVideoUrl(file) {
  return `${import.meta.env.BASE_URL}signs/${file}`;
}

const isPlaceholder = (entry) => entry.status !== 'verified';

function safePlay(video, onBlocked) {
  const promise = video.play();
  if (promise && typeof promise.catch === 'function') {
    promise.catch((error) => {
      // AbortError = a new load() interrupted play(); that is expected when changing clips.
      if (error && error.name !== 'AbortError') onBlocked();
    });
  }
}

/**
 * Plays the clips of `playlist` one after another.
 * `runKey` changes for every new translation and restarts playback from the first clip.
 */
export default function SignPlayer({ playlist, runKey }) {
  const videoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [playToken, setPlayToken] = useState(0); // bumped to force a reload of the same clip

  const total = playlist.length;
  const current = playlist[index] ?? null;
  const currentVideo = current ? current.video : null;

  // A new translation arrived: start again from the first clip.
  useEffect(() => {
    setIndex(0);
    setFinished(false);
    setVideoError(false);
    setPlaying(total > 0);
    setPlayToken((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  // Load (and play, if playing) whenever the clip changes or a replay is requested.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;
    setVideoError(false);
    video.load();
    if (playing) safePlay(video, () => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playToken, currentVideo]);

  // Play / pause toggle.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;
    if (playing) safePlay(video, () => setPlaying(false));
    else video.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // If a clip file is missing while playing, show the problem briefly and move on.
  useEffect(() => {
    if (!videoError || !playing) return undefined;
    const timer = setTimeout(() => {
      if (index < total - 1) setIndex(index + 1);
      else {
        setPlaying(false);
        setFinished(true);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [videoError, playing, index, total]);

  function handleEnded() {
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      setPlaying(false);
      setFinished(true);
    }
  }

  function replay() {
    if (total === 0) return;
    setIndex(0);
    setFinished(false);
    setVideoError(false);
    setPlaying(true);
    setPlayToken((t) => t + 1);
  }

  function togglePlay() {
    if (total === 0) return;
    if (finished) {
      replay();
      return;
    }
    setPlaying((p) => !p);
  }

  function goTo(target) {
    if (target < 0 || target > total - 1) return;
    setIndex(target);
    setFinished(false);
    setVideoError(false);
    setPlaying(true);
  }

  const disabled = total === 0;

  return (
    <section className="panel player-panel" aria-labelledby="player-title">
      <div className="panel-head">
        <h2 id="player-title">شاشة الإشارة</h2>
        {total > 0 && (
          <span className="counter" aria-live="polite">
            الإشارة {index + 1} من {total}
          </span>
        )}
      </div>

      {current && isPlaceholder(current) && (
        <div className="placeholder-badge" role="note">
          ⚠ فيديو تجريبي — ليس ترجمة حقيقية بلغة الإشارة المصرية
        </div>
      )}

      <div className="stage">
        {current ? (
          <video
            key="sign-video"
            ref={videoRef}
            className="stage-video"
            src={signVideoUrl(current.video)}
            muted
            playsInline
            preload="auto"
            aria-label={`فيديو إشارة: ${current.text}`}
            onEnded={handleEnded}
            onError={() => setVideoError(true)}
            onLoadedData={() => setVideoError(false)}
          />
        ) : (
          <div className="stage-empty">
            <span className="stage-empty-icon" aria-hidden="true">
              🤟
            </span>
            <p>ستظهر الإشارات هنا بعد الترجمة</p>
          </div>
        )}

        {current && videoError && (
          <div className="stage-error" role="alert">
            <p>تعذّر تحميل ملف الفيديو</p>
            <code dir="ltr">public/signs/{current.video}</code>
          </div>
        )}
      </div>

      {current && (
        <p className="now-playing" aria-live="polite">
          الإشارة الحالية: <strong>{current.text}</strong>
        </p>
      )}

      <div className="controls" role="group" aria-label="أدوات التحكم في الإشارة">
        <button type="button" className="btn btn-secondary" onClick={() => goTo(index - 1)} disabled={disabled || index === 0}>
          <span aria-hidden="true">→</span> السابق
        </button>

        <button type="button" className="btn btn-primary btn-play" onClick={togglePlay} disabled={disabled}>
          <span aria-hidden="true">{playing ? '⏸' : '▶'}</span> {playing ? 'إيقاف مؤقت' : finished ? 'إعادة التشغيل' : 'تشغيل'}
        </button>

        <button type="button" className="btn btn-secondary" onClick={replay} disabled={disabled}>
          <span aria-hidden="true">↻</span> إعادة
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => goTo(index + 1)}
          disabled={disabled || index >= total - 1}
        >
          التالي <span aria-hidden="true">←</span>
        </button>
      </div>

      {total > 1 && (
        <ol className="steps" aria-label="تسلسل الإشارات">
          {playlist.map((entry, i) => (
            <li key={`${entry.id}-${i}`}>
              <button
                type="button"
                className={`step ${i === index ? 'is-current' : ''}`}
                onClick={() => goTo(i)}
                aria-current={i === index ? 'true' : undefined}
              >
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
                {entry.text}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
