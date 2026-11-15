/**
 * Sign translation engine (pure JavaScript, no DOM / React / Vite dependencies,
 * so it can be unit-tested directly in Node).
 *
 * Strategy
 *  1. Normalise Arabic text (remove diacritics/tatweel, unify alef / ya / ta-marbuta / kaf).
 *  2. Split into words.
 *  3. Greedy longest-match: at every position try the longest known phrase
 *     first, then shorter ones, down to a single word.
 *  4. Anything that cannot be matched is reported as MISSING. It is never
 *     replaced by a guessed or "closest" sign.
 */

const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g; // tashkeel, tanween, dagger alef, Quranic marks
const TATWEEL = /ـ/g;

/** Normalise an Arabic string so spelling variants compare equal. */
export function normalizeArabic(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .replace(DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ی/g, 'ي') // Persian ya
    .replace(/ک/g, 'ك') // Persian kaf
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim();
}

/**
 * Split text into words. Returns [{ raw, norm }] where `raw` is what the user
 * wrote (for display) and `norm` is the normalised form (for matching).
 */
export function tokenize(text) {
  return String(text ?? '')
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ') // punctuation -> space (Arabic ، ؟ ؛ included)
    .split(/\s+/)
    .map((raw) => ({ raw, norm: normalizeArabic(raw) }))
    .filter((token) => token.norm.length > 0);
}

/** Returns a list of human-readable problems found in a dictionary (empty = OK). */
export function validateDictionary(dictionary) {
  const problems = [];
  const seen = new Map();
  const ids = new Set();

  if (!dictionary || !Array.isArray(dictionary.signs)) {
    return ['القاموس غير صالح: الحقل "signs" مفقود / dictionary.signs is missing'];
  }

  dictionary.signs.forEach((entry, i) => {
    const where = `signs[${i}]`;
    if (!entry.id) problems.push(`${where}: missing "id"`);
    if (!entry.text) problems.push(`${where}: missing "text"`);
    if (!entry.video) problems.push(`${where}: missing "video"`);
    if (entry.id) {
      if (ids.has(entry.id)) problems.push(`${where}: duplicate id "${entry.id}"`);
      ids.add(entry.id);
    }
    const key = tokenize(entry.text).map((t) => t.norm).join(' ');
    if (key) {
      if (seen.has(key)) {
        problems.push(`${where}: "${entry.text}" duplicates "${seen.get(key)}" after normalisation`);
      }
      seen.set(key, entry.text);
    }
  });

  return problems;
}

/**
 * Build a translator from a dictionary object ({ signs: [{ id, text, video, status }] }).
 *
 * translate(text) returns:
 * {
 *   input,                    // original text
 *   status,                   // 'empty' | 'full' | 'partial' | 'none'
 *   total,                    // number of words in the input
 *   matched,                  // number of words covered by a sign
 *   segments,                 // ordered [{ kind: 'sign', text, entry } | { kind: 'missing', text }]
 *   playlist,                 // ordered list of dictionary entries to play
 *   missing,                  // ordered list of unsupported words (never translated)
 * }
 */
export function createTranslator(dictionary) {
  const index = new Map(); // normalised phrase -> entry
  let maxWords = 1;

  for (const entry of dictionary.signs) {
    const words = tokenize(entry.text);
    if (words.length === 0) continue;
    const key = words.map((w) => w.norm).join(' ');
    if (!index.has(key)) index.set(key, entry); // first definition wins
    maxWords = Math.max(maxWords, words.length);
  }

  function translate(text) {
    const tokens = tokenize(text);
    const segments = [];
    const playlist = [];
    const missing = [];
    let matched = 0;

    let i = 0;
    while (i < tokens.length) {
      let hit = null;
      const longest = Math.min(maxWords, tokens.length - i);

      // Complete phrases are tried first, then shorter ones, then single words.
      for (let n = longest; n >= 1; n--) {
        const key = tokens
          .slice(i, i + n)
          .map((t) => t.norm)
          .join(' ');
        const entry = index.get(key);
        if (entry) {
          hit = { entry, n };
          break;
        }
      }

      if (hit) {
        const raw = tokens
          .slice(i, i + hit.n)
          .map((t) => t.raw)
          .join(' ');
        segments.push({ kind: 'sign', text: raw, entry: hit.entry });
        playlist.push(hit.entry);
        matched += hit.n;
        i += hit.n;
      } else {
        segments.push({ kind: 'missing', text: tokens[i].raw });
        missing.push(tokens[i].raw);
        i += 1;
      }
    }

    let status = 'empty';
    if (tokens.length > 0) {
      if (playlist.length === 0) status = 'none';
      else if (missing.length === 0) status = 'full';
      else status = 'partial';
    }

    return { input: String(text ?? ''), status, total: tokens.length, matched, segments, playlist, missing };
  }

  return { translate, size: index.size };
}
