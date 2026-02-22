#!/usr/bin/env node
/*
  Simple i18n audit: finds hardcoded CJK chars or English sentences outside the i18n dictionary.
  Usage: node tools/i18n_audit.js index.html
*/
const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node tools/i18n_audit.js <file>');
  process.exit(1);
}
const text = fs.readFileSync(path, 'utf8');

// Try to ignore the i18n dictionary block to reduce noise
let ignoreRanges = [];
{
  const start = text.indexOf('const i18n =');
  if (start !== -1) {
    const end = text.indexOf('function t(key)', start);
    if (end !== -1) ignoreRanges.push([start, end]);
  }
}

function inIgnore(i) {
  return ignoreRanges.some(([a,b]) => i >= a && i < b);
}

const lines = text.split(/\n/);
let offset = 0;
const hits = [];
for (let ln = 0; ln < lines.length; ln++) {
  const line = lines[ln];
  const lineStart = offset;
  offset += line.length + 1;

  if (inIgnore(lineStart)) continue;

  // detect CJK
  if (/[\u4e00-\u9fff]/.test(line)) {
    // ignore comment-only lines
    if (/^\s*\/\//.test(line)) continue;
    hits.push({ ln: ln + 1, kind: 'CJK', line: line.trim().slice(0, 200) });
    continue;
  }

  // detect long English UI strings (rough)
  if (/(addAIMessage|addUserMessage|showToast|confirm\(|prompt\(|title=)/.test(line) && /[A-Za-z]{6,}/.test(line)) {
    if (/t\(/.test(line)) continue;
    hits.push({ ln: ln + 1, kind: 'EN?', line: line.trim().slice(0, 200) });
  }
}

console.log(JSON.stringify({ file: path, hitsCount: hits.length, hits: hits.slice(0, 200) }, null, 2));
if (hits.length > 0) process.exitCode = 2;
