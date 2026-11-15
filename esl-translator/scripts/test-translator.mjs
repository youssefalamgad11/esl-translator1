// Run with: npm test
// Checks the translation engine and that every video in the dictionary exists.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTranslator, validateDictionary } from '../src/utils/signTranslator.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dictionary = JSON.parse(readFileSync(join(root, 'src/data/signs.json'), 'utf8'));
const { translate } = createTranslator(dictionary);

let failures = 0;
function check(name, condition, details = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name} ${details}`);
  }
}
const ids = (r) => r.playlist.map((e) => e.id).join(',');

console.log('Dictionary');
const problems = validateDictionary(dictionary);
check('dictionary is valid', problems.length === 0, problems.join('; '));
for (const entry of dictionary.signs) {
  check(`video exists: public/signs/${entry.video}`, existsSync(join(root, 'public/signs', entry.video)));
}

console.log('Translation');
let r = translate('أنا بحبك');
check('full phrase wins over single words', ids(r) === 'ana-bahebbak' && r.status === 'full', ids(r));

r = translate('أنا');
check('single word: أنا', ids(r) === 'ana');

r = translate('أنا أنت بحبك');
check('sentence split into signs', ids(r) === 'ana,enta,bahebbak' && r.status === 'full', ids(r));

r = translate('صباح الخير');
check('phrase: صباح الخير', ids(r) === 'sabah-el-kheir');
r = translate('مساء الخير');
check('phrase: مساء الخير', ids(r) === 'masa-el-kheir');

check('tanween ignored: شكراً', ids(translate('شكراً')) === 'shokran');
check('plain spelling: شكرا', ids(translate('شكرا')) === 'shokran');
check('alef variants: إزيك / ازيك', ids(translate('إزيك')) === 'ezzayyak' && ids(translate('ازيك')) === 'ezzayyak');
check('punctuation ignored', ids(translate('أنا بحبك!؟،.')) === 'ana-bahebbak');
check('extra spaces ignored', ids(translate('   صباح    الخير  ')) === 'sabah-el-kheir');

r = translate('صباح الخير يا أحمد');
check(
  'unsupported words are reported, not translated',
  r.status === 'partial' && ids(r) === 'sabah-el-kheir' && r.missing.join(',') === 'يا,أحمد',
  JSON.stringify(r.missing),
);
check('matched/total counts', r.matched === 2 && r.total === 4, `${r.matched}/${r.total}`);

r = translate('مرحبا كيف الحال');
check('nothing supported -> status none, empty playlist', r.status === 'none' && r.playlist.length === 0 && r.missing.length === 3);

r = translate('   ');
check('empty input -> status empty', r.status === 'empty' && r.playlist.length === 0);

r = translate('Hello');
check('non-Arabic word is treated as missing', r.status === 'none' && r.missing[0] === 'Hello');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
