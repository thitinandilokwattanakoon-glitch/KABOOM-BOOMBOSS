import { useRef, useState } from 'react';
import { AI_PROMPT, importQuestionFile, parseQuestionText, SAMPLE_CSV, SAMPLE_TEXT, type ImportResult } from '../lib/importQuestions';
import type { Question } from '../types/questionSet';

const LETTERS = ['ก', 'ข', 'ค', 'ง'];

function download(name: string, text: string, type: string) {
  // The BOM makes Excel open Thai text correctly.
  const url = URL.createObjectURL(new Blob(['﻿', text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Add many questions at once from a Word / Excel / CSV / text file, or from pasted text.
 * The teacher sees what was read (and what could not be read) before adding it to the set.
 */
export function QuestionImport({ room, onAdd }: { room: number; onAdd: (questions: Question[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setSource(file.name);
    setResult(await importQuestionFile(file));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function readPasted() {
    setSource('ข้อความที่วาง');
    setResult(parseQuestionText(pasted));
  }

  function add() {
    if (!result) return;
    onAdd(result.questions.slice(0, room));
    setResult(null);
    setPasted('');
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!open) {
    return (
      <div className="panel qi">
        <div className="panel-head">
          <div>
            <h2>นำเข้าโจทย์จากไฟล์</h2>
            <p className="hint qi-lead">มีข้อสอบอยู่แล้วใน Word, Excel หรือข้อความ เพิ่มเข้าชุดนี้ได้ทีเดียวหลายข้อ</p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
            เปิด
          </button>
        </div>
      </div>
    );
  }

  const over = result ? Math.max(0, result.questions.length - room) : 0;

  return (
    <div className="panel qi">
      <div className="panel-head">
        <h2>นำเข้าโจทย์จากไฟล์</h2>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
          ปิด
        </button>
      </div>

      <div className="qi-how">
        <div>
          <h3>แบบข้อความ (Word .docx, .txt หรือวางข้อความ)</h3>
          <pre>{SAMPLE_TEXT.split('\n\n')[0]}</pre>
          <p className="hint">
            ขึ้นต้นข้อด้วยเลขข้อ ตัวเลือกใช้ ก ข ค ง หรือ A B C D ใส่ * หน้าตัวเลือกที่ถูกแทนบรรทัดเฉลยก็ได้ บรรทัด "ระดับ" ไม่ใส่ก็ได้ (จะเป็นง่าย) ใน Word
            ให้พิมพ์เลขข้อและ ก. ข. เอง อย่าใช้ลำดับเลขอัตโนมัติ
          </p>
        </div>
        <div>
          <h3>แบบตาราง (Excel .xlsx, .csv)</h3>
          <pre>โจทย์ | ก | ข | ค | ง | เฉลย | ระดับ</pre>
          <p className="hint">หนึ่งแถวต่อหนึ่งข้อ เรียงคอลัมน์ตามนี้ แถวหัวตารางจะถูกข้ามเอง ช่องเฉลยใส่ ก ข ค ง</p>
          <div className="row-actions">
            <button type="button" className="btn-ghost btn-sm" onClick={() => download('kaboom-ตัวอย่างโจทย์.txt', SAMPLE_TEXT, 'text/plain;charset=utf-8')}>
              ดาวน์โหลดตัวอย่าง .txt
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => download('kaboom-ตัวอย่างโจทย์.csv', SAMPLE_CSV, 'text/csv;charset=utf-8')}>
              ดาวน์โหลดตัวอย่าง .csv
            </button>
          </div>
        </div>
      </div>

      <details className="qi-ai">
        <summary>อยากให้ AI ช่วยออกโจทย์ตามรูปแบบนี้</summary>
        <p className="hint">คัดลอกข้อความนี้ไปวางในแชต AI ที่ใช้อยู่ แก้หัวข้อในวงเล็บ แล้วนำคำตอบมาวางในช่องด้านล่าง อย่าลืมตรวจโจทย์และเฉลยก่อนใช้จริง</p>
        <pre>{AI_PROMPT}</pre>
        <button type="button" className="btn-ghost btn-sm" onClick={() => void copyPrompt()}>
          {copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
        </button>
      </details>

      <div className="qi-inputs">
        <input ref={fileRef} type="file" accept=".docx,.xlsx,.csv,.txt" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        <button type="button" className="btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'กำลังอ่านไฟล์…' : 'เลือกไฟล์ (.docx .xlsx .csv .txt)'}
        </button>
        <div className="field">
          <label htmlFor="qi-paste">หรือวางข้อความโจทย์ที่นี่</label>
          <textarea id="qi-paste" rows={6} value={pasted} placeholder={SAMPLE_TEXT.split('\n\n')[0]} onChange={(e) => setPasted(e.target.value)} />
        </div>
        <button type="button" className="btn-ghost" disabled={!pasted.trim()} onClick={readPasted}>
          อ่านข้อความที่วาง
        </button>
      </div>

      {result && (
        <div className="qi-result" role="status">
          <h3>
            อ่านจาก {source}: ได้ {result.questions.length} ข้อ
            {result.problems.length > 0 && ` · อ่านไม่ได้ ${result.problems.length} รายการ`}
          </h3>
          {result.problems.length > 0 && (
            <ul className="qi-problems">
              {result.problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
          {result.questions.length > 0 && (
            <>
              <ol className="qi-preview">
                {result.questions.map((q, i) => (
                  <li key={i}>
                    <span>{q.text}</span>
                    <small>
                      เฉลย {LETTERS[q.correctIndex]}. {q.choices[q.correctIndex]}
                    </small>
                  </li>
                ))}
              </ol>
              {over > 0 && <p className="field-error">ชุดคำถามมีได้ไม่เกิน 100 ข้อ จะเพิ่มได้เฉพาะ {room} ข้อแรก</p>}
              <div className="row-actions">
                <button type="button" className="btn-primary btn-sm" disabled={room === 0} onClick={add}>
                  เพิ่ม {Math.min(result.questions.length, room)} ข้อเข้าชุดนี้
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setResult(null)}>
                  ยกเลิก
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
