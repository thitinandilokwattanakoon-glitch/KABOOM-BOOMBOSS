import type { Difficulty, Question } from '../types/questionSet';
import { BASE_DAMAGE } from './balance';

/**
 * Reads questions out of a file the teacher prepared (Word .docx, Excel .xlsx, .csv, .txt) or pasted text.
 * Everything happens in the browser: nothing is uploaded, and no extra package is needed
 * (.docx and .xlsx are zip files of XML, read with the browser's own unzip).
 *
 * Text format (one question after another):
 *   1. question text
 *   ก. choice      (ก ข ค ง or A B C D)
 *   ข. choice
 *   ค. choice
 *   ง. choice
 *   เฉลย: ข         (a "*" in front of the right choice works too)
 *   ระดับ: ง่าย      (optional: ง่าย / ปานกลาง / ยาก)
 *
 * Table format (Excel / CSV), one question per row:
 *   โจทย์ | ก | ข | ค | ง | เฉลย | ระดับ
 */

export interface ImportResult {
  questions: Question[];
  /** What could not be read, in Thai, ready to show. */
  problems: string[];
}

const LETTERS = 'กขคง';

function answerIndex(raw: string): number {
  const v = raw.trim().replace(/[.)\s]+$/, '').toLowerCase();
  if (v.length !== 1) return -1;
  const th = LETTERS.indexOf(v);
  if (th >= 0) return th;
  const en = 'abcd'.indexOf(v);
  if (en >= 0) return en;
  const num = '1234'.indexOf(v);
  return num;
}

function difficultyOf(raw: string): Difficulty | null {
  const v = raw.trim().toLowerCase();
  if (/^(ง่าย|easy)/.test(v)) return 'EASY';
  if (/^(ปานกลาง|กลาง|medium)/.test(v)) return 'MEDIUM';
  if (/^(ยาก|hard)/.test(v)) return 'HARD';
  return null;
}

interface Draft {
  n: number;
  text: string[];
  choices: string[];
  correct: number;
  difficulty: Difficulty;
}

function finish(d: Draft, out: ImportResult) {
  const text = d.text.join(' ').trim();
  const label = `ข้อ ${d.n}`;
  if (!text) return out.problems.push(`${label}: ไม่พบโจทย์`);
  if (d.choices.length !== 4) return out.problems.push(`${label}: ต้องมีตัวเลือก 4 ข้อ (พบ ${d.choices.length})`);
  if (d.choices.some((c) => !c)) return out.problems.push(`${label}: มีตัวเลือกที่ว่าง`);
  if (d.correct < 0) return out.problems.push(`${label}: ไม่พบเฉลย (เช่น "เฉลย: ข")`);
  out.questions.push({ text: text.slice(0, 500), choices: d.choices.map((c) => c.slice(0, 200)), correctIndex: d.correct, difficulty: d.difficulty });
}

const Q_START = /^(?:ข้อ(?:ที่)?\s*)?(\d{1,3})\s*[.)]\s*(.*)$/;
const CHOICE = /^(\*?)\s*([กขคงA-Da-d])\s*[.)]\s*(.*?)\s*(\*?)$/;
const ANSWER = /^(?:เฉลย|คำตอบ|ตอบ|answer|ans)\s*[:：=]?\s*(.+)$/i;
const LEVEL = /^(?:ระดับ|ความยาก|level)\s*[:：=]?\s*(.+)$/i;

/** Questions typed as text. */
export function parseQuestionText(source: string): ImportResult {
  const out: ImportResult = { questions: [], problems: [] };
  let cur: Draft | null = null;
  let count = 0;
  for (const rawLine of source.replace(/\r/g, '').split('\n')) {
    const line = rawLine.replace(/\t/g, ' ').trim();
    if (!line) continue;
    const answer = ANSWER.exec(line);
    const level = LEVEL.exec(line);
    const choice = CHOICE.exec(line);
    const start = Q_START.exec(line);
    if (cur && answer) {
      cur.correct = answerIndex(answer[1]);
    } else if (cur && level) {
      cur.difficulty = difficultyOf(level[1]) ?? cur.difficulty;
    } else if (cur && choice && cur.choices.length < 4) {
      if (choice[1] || choice[4]) cur.correct = cur.choices.length;
      cur.choices.push(choice[3].trim());
    } else if (start && (!cur || cur.choices.length > 0 || cur.text.length === 0)) {
      if (cur) finish(cur, out);
      cur = { n: ++count, text: [start[2]], choices: [], correct: -1, difficulty: 'EASY' };
    } else if (cur && cur.choices.length === 0) {
      cur.text.push(line); // the question runs over several lines
    } else if (cur) {
      cur.choices[cur.choices.length - 1] += ` ${line}`; // a long choice wrapped to the next line
    }
  }
  if (cur) finish(cur, out);
  if (count === 0) out.problems.push('ไม่พบโจทย์ในข้อความนี้ ตรวจว่าแต่ละข้อขึ้นต้นด้วยเลขข้อ เช่น "1." แล้วตามด้วยตัวเลือก ก. ข. ค. ง.');
  return out;
}

/** Questions in a table: question, four choices, answer, optional difficulty. A heading row is skipped. */
export function parseQuestionRows(rows: string[][]): ImportResult {
  const out: ImportResult = { questions: [], problems: [] };
  let n = 0;
  rows.forEach((row, i) => {
    const cells = row.map((c) => (c ?? '').trim());
    if (cells.every((c) => !c)) return;
    const correct = answerIndex(cells[5] ?? '');
    if (i === 0 && correct < 0) return; // heading row
    finish({ n: ++n, text: [cells[0] ?? ''], choices: cells.slice(1, 5).filter((_, k) => k < 4), correct, difficulty: difficultyOf(cells[6] ?? '') ?? 'EASY' }, out);
  });
  if (n === 0) out.problems.push('ไม่พบโจทย์ในตาราง ตรวจว่าเรียงคอลัมน์เป็น โจทย์ | ก | ข | ค | ง | เฉลย | ระดับ');
  return out;
}

// ---------------------------------------------------------------- CSV

export function csvRows(source: string): string[][] {
  const text = source.replace(/^﻿/, '');
  const first = text.split('\n')[0] ?? '';
  const sep = first.includes('\t') ? '\t' : first.split(';').length > first.split(',').length ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------- zip (docx / xlsx)

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Reads the wanted files out of a zip as text. */
async function unzip(buf: ArrayBuffer, wanted: (name: string) => boolean): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('ไฟล์นี้เปิดไม่ได้ (ไม่ใช่ไฟล์ Word หรือ Excel แบบใหม่)');
  const total = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const utf8 = new TextDecoder('utf-8');
  const out = new Map<string, string>();
  for (let n = 0; n < total && view.getUint32(at, true) === 0x02014b50; n++) {
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = utf8.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    if (wanted(name)) {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const raw = bytes.subarray(start, start + size);
      out.set(name, utf8.decode(method === 0 ? raw : await inflate(raw)));
    }
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const unescapeXml = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');

/** Plain text of a Word document, one line per paragraph. */
async function docxText(buf: ArrayBuffer): Promise<string> {
  const xml = (await unzip(buf, (n) => n === 'word/document.xml')).get('word/document.xml');
  if (!xml) throw new Error('อ่านไฟล์ Word นี้ไม่ได้');
  return xml
    .split(/<\/w:p>/)
    .map((p) => {
      let line = '';
      for (const m of p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)) line += m[1] !== undefined ? unescapeXml(m[1]) : m[0] === '<w:tab/>' ? ' ' : '\n';
      return line;
    })
    .join('\n');
}

/** Rows of the first sheet of an Excel file. */
async function xlsxRows(buf: ArrayBuffer): Promise<string[][]> {
  const files = await unzip(buf, (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const sheetName = [...files.keys()].filter((n) => n.startsWith('xl/worksheets/')).sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
  if (!sheetName) throw new Error('อ่านไฟล์ Excel นี้ไม่ได้');
  const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((m) => unescapeXml(m[1])).join('');
  const shared = (files.get('xl/sharedStrings.xml') ?? '').split(/<\/si>/).slice(0, -1).map(texts);
  const rows: string[][] = [];
  for (const rowXml of (files.get(sheetName) ?? '').split(/<\/row>/)) {
    const row: string[] = [];
    for (const c of rowXml.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(c[1]);
      if (!ref) continue;
      const col = [...ref[1]].reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const body = c[2] ?? '';
      const v = /<v>([^<]*)<\/v>/.exec(body);
      const value = /t="s"/.test(c[1]) ? shared[Number(v?.[1])] ?? '' : /t="inlineStr"/.test(c[1]) ? texts(body) : unescapeXml(v?.[1] ?? '');
      row[col] = value;
    }
    if (row.length) rows.push(Array.from(row, (x) => x ?? ''));
  }
  return rows;
}

/** Reads questions from a file chosen by the teacher. */
export async function importQuestionFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.docx')) return parseQuestionText(await docxText(await file.arrayBuffer()));
    if (name.endsWith('.xlsx')) return parseQuestionRows(await xlsxRows(await file.arrayBuffer()));
    if (name.endsWith('.csv')) return parseQuestionRows(csvRows(await file.text()));
    if (name.endsWith('.txt')) return parseQuestionText(await file.text());
    return { questions: [], problems: ['รองรับเฉพาะไฟล์ .docx .xlsx .csv และ .txt (ไฟล์ .doc หรือ .xls แบบเก่าให้บันทึกเป็นแบบใหม่ก่อน)'] };
  } catch (e) {
    return { questions: [], problems: [e instanceof Error ? e.message : 'อ่านไฟล์นี้ไม่ได้'] };
  }
}

// ---------------------------------------------------------------- samples for the teacher

export const SAMPLE_TEXT = `1. 7 x 8 เท่ากับเท่าไร
ก. 54
ข. 56
ค. 58
ง. 64
เฉลย: ข
ระดับ: ง่าย

2. เมืองหลวงของประเทศไทยคือเมืองใด
ก. เชียงใหม่
ข. ภูเก็ต
ค. กรุงเทพมหานคร
ง. ขอนแก่น
เฉลย: ค
ระดับ: ปานกลาง
`;

export const SAMPLE_CSV = `โจทย์,ก,ข,ค,ง,เฉลย,ระดับ
7 x 8 เท่ากับเท่าไร,54,56,58,64,ข,ง่าย
เมืองหลวงของประเทศไทยคือเมืองใด,เชียงใหม่,ภูเก็ต,กรุงเทพมหานคร,ขอนแก่น,ค,ปานกลาง
`;

/** A request the teacher can paste into any AI chat to get questions in the right format. */
export const AI_PROMPT = `ช่วยออกข้อสอบปรนัย 4 ตัวเลือก จำนวน 10 ข้อ เรื่อง [ใส่หัวข้อและระดับชั้น]
ให้เขียนตามรูปแบบนี้ทุกข้อ ห้ามใส่ข้อความอื่นนอกเหนือจากรูปแบบ:

1. โจทย์
ก. ตัวเลือก
ข. ตัวเลือก
ค. ตัวเลือก
ง. ตัวเลือก
เฉลย: ข
ระดับ: ง่าย

เว้นบรรทัดว่างระหว่างข้อ ระดับเลือกได้ 3 แบบ ข้อที่ยากกว่าจะทำดาเมจใส่บอสได้มากกว่าเมื่อตอบถูก:
- ง่าย = ดาเมจ ${BASE_DAMAGE.EASY}
- ปานกลาง = ดาเมจ ${BASE_DAMAGE.MEDIUM}
- ยาก = ดาเมจ ${BASE_DAMAGE.HARD}`;
