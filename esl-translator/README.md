# مترجم لغة الإشارة المصرية — Egyptian Sign Language Translator

A browser-only MVP: speak (or type) Egyptian Arabic and the app plays the matching sign videos in sequence.

- **No backend.** No Python, Node server, database, serverless functions, paid APIs or environment variables.
- **Stack:** React + Vite + plain CSS, the browser's Web Speech API (`ar-EG`), a local JSON dictionary, and the HTML5 `<video>` element.
- **Honest by design:** words that are not in the dictionary are **never** translated or replaced with a guessed sign — they are shown in a clear warning.

> ⚠️ **The videos in `public/signs/` are labeled placeholders, not real Egyptian Sign Language.**
> Each shows the word, "PLACEHOLDER VIDEO" and "NOT A REAL EGYPTIAN SIGN LANGUAGE SIGN".
> Replace them with real, reviewed recordings (ideally made or approved by Deaf ESL signers) before real use.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173  (open in Chrome)
npm test           # checks the translation engine + that every video file exists
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Project structure

```
src/
  components/
    Microphone.jsx          mic button, recording status, permission errors
    TextDisplay.jsx         editable recognized text + translate / clear
    SignPlayer.jsx          sequential video player (play/pause, replay, next, previous)
    TranslationResult.jsx   how the sentence was split + missing-sign warnings
    TranslationHistory.jsx  previous translations (saved in localStorage)
  data/
    signs.json              the sign dictionary
  utils/
    speechRecognition.js    Web Speech API wrapper (ar-EG)
    signTranslator.js       normalisation + longest-phrase-first matching
  App.jsx
  main.jsx
  style.css
public/
  signs/                    the MP4 files
scripts/
  test-translator.mjs       `npm test`
```

## How translation works

1. Arabic text is normalised: diacritics and tatweel removed; `أ إ آ` → `ا`; `ى` → `ي`; `ة` → `ه`. So `شكراً` = `شكرا`, `إزيك` = `ازيك`.
2. The text is split into words.
3. At each position the **longest** dictionary phrase is tried first, then shorter ones, down to a single word.
   For example `أنا بحبك` plays one sign (the full phrase), while `أنا أنت بحبك` plays three.
4. Every word with no match is listed as **missing** and gets no video.

## Replacing the placeholder videos with real signs

1. Record or obtain the real ESL video for a word.
2. Save it as MP4 (H.264 so it plays in Chrome) in `public/signs/`, using the same file name as in `signs.json` (or any name, then update the entry).
3. In `src/data/signs.json` change that entry's `"status"` from `"placeholder"` to `"verified"`.
   The yellow "placeholder" badge on the player disappears for verified entries, and the global warning banner disappears once every entry is verified.

## Adding new words or phrases

Add an object to `signs` in `src/data/signs.json`:

```json
{ "id": "salam", "text": "السلام عليكم", "video": "salam.mp4", "status": "placeholder" }
```

- `text` can be one word or a whole phrase; phrases are matched before single words.
- Put the video in `public/signs/`.
- Run `npm test` — it checks for duplicate phrases and missing video files.

Only add a word once you have a real sign for it.

## Deploy to Vercel (GitHub)

1. Create a new GitHub repository and push this project:
   ```bash
   git init
   git add .
   git commit -m "Egyptian Sign Language Translator"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com), sign in with GitHub and click **Add New… → Project**.
3. Import the repository. Vercel detects **Vite** automatically:
   - Build command: `npm run build`
   - Output directory: `dist`
   - No environment variables needed.
4. Click **Deploy**. Every later `git push` redeploys automatically.

Vercel serves the site over HTTPS, which the microphone requires.

## Browser support & privacy

- **Voice input** works in Google Chrome (desktop and Android) and Microsoft Edge. Firefox and some other browsers do not support the Web Speech API — typing text manually still works everywhere.
- The microphone needs HTTPS or `localhost`, and the user must allow microphone access.
- In Chrome, speech recognition is performed by the browser's online speech service, so the recorded audio is sent to Google to be converted to text. The app itself has no server and stores nothing except the translation history in the browser's own `localStorage` (use **مسح السجل** to clear it).

## Known limits of this MVP

- Matching is exact-word based: no morphology (e.g. `بحبكم` is not recognised as a form of `بحبك`) and no Egyptian-Arabic-to-ESL grammar. ESL has its own grammar and word order; this tool is a word/phrase lookup, not a full translator.
- The dictionary currently has 8 entries, all placeholders.
