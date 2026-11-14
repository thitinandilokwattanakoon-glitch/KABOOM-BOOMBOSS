import { useEffect, useMemo, useRef, useState } from 'react';
import { questionSetsApi } from '../api/questionSets';
import type { Difficulty, Question } from '../types/questionSet';
import { QuestionImport } from './QuestionImport';

interface Props {
  setId: string | null; // null = new set
  onClose: () => void;
}

interface Item {
  key: number;
  q: Question;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = { EASY: 'ง่าย', MEDIUM: 'ปานกลาง', HARD: 'ยาก' };
const LETTERS = ['ก', 'ข', 'ค', 'ง'];

function blankQuestion(): Question {
  return { text: '', choices: ['', '', '', ''], correctIndex: -1, difficulty: 'EASY' };
}

function questionError(q: Question): string | null {
  if (!q.text.trim()) return 'กรอกโจทย์';
  if (q.text.trim().length > 500) return 'โจทย์ยาวไม่เกิน 500 ตัวอักษร';
  if (q.choices.some((c) => !c.trim())) return 'กรอกตัวเลือกให้ครบ 4 ข้อ';
  if (q.choices.some((c) => c.trim().length > 200)) return 'ตัวเลือกยาวไม่เกิน 200 ตัวอักษร';
  if (q.correctIndex < 0) return 'เลือกคำตอบที่ถูก (วงกลมหน้าตัวเลือก)';
  return null;
}

export function QuestionSetEditor({ setId, onClose }: Props) {
  const nextKey = useRef(1);
  const [loading, setLoading] = useState(setId !== null);
  const [name, setName] = useState('');
  const [items, setItems] = useState<Item[]>([{ key: 0, q: blankQuestion() }]);
  const [saved, setSaved] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null);

  // Snapshot of what is stored, to know whether there are unsaved edits.
  const snapshot = (n: string, its: Item[]) => JSON.stringify({ n, q: its.map((i) => i.q) });
  const current = useMemo(() => snapshot(name, items), [name, items]);
  const dirty = !loading && current !== saved;

  useEffect(() => {
    if (setId === null) {
      setSaved(snapshot('', [{ key: 0, q: blankQuestion() }]));
      return;
    }
    questionSetsApi
      .get(setId)
      .then((s) => {
        const loaded = s.questions.map((q) => ({ key: nextKey.current++, q }));
        setName(s.name);
        setItems(loaded);
        setSaved(snapshot(s.name, loaded));
      })
      .catch((e) => setServerError(e instanceof Error ? e.message : 'โหลดชุดคำถามไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [setId]);

  function updateQuestion(key: number, patch: Partial<Question>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, q: { ...i.q, ...patch } } : i)));
  }
  function updateChoice(key: number, idx: number, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, q: { ...i.q, choices: i.q.choices.map((c, n) => (n === idx ? value : c)) } } : i))
    );
  }
  function addQuestion() {
    setItems((prev) => [...prev, { key: nextKey.current++, q: blankQuestion() }]);
  }
  /** Questions read from a file go after the ones already here; an untouched empty first question is dropped. */
  function addImported(questions: Question[]) {
    setItems((prev) => {
      const kept = prev.filter((i) => i.q.text.trim() || i.q.choices.some((c) => c.trim()));
      return [...kept, ...questions.map((q) => ({ key: nextKey.current++, q }))];
    });
  }
  function removeQuestion(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }

  const nameError = !name.trim() ? 'ตั้งชื่อชุดคำถาม' : name.trim().length > 100 ? 'ชื่อชุดยาวไม่เกิน 100 ตัวอักษร' : null;
  const hasError = !!nameError || items.some((i) => questionError(i.q));

  async function save() {
    setServerError('');
    setShowErrors(true);
    if (hasError) return;
    setBusy(true);
    const input = { name: name.trim(), questions: items.map((i) => i.q) };
    try {
      if (setId === null) await questionSetsApi.create(input);
      else await questionSetsApi.update(setId, input);
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (setId === null) return;
    setBusy(true);
    try {
      await questionSetsApi.remove(setId);
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ ลองใหม่อีกครั้ง');
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  function back() {
    if (dirty) setConfirm('leave');
    else onClose();
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="spinner" role="status" aria-label="กำลังโหลด" />
      </div>
    );
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>{setId === null ? 'สร้างชุดคำถามใหม่' : 'แก้ไขชุดคำถาม'}</h2>
          <button type="button" className="btn-ghost btn-sm" onClick={back}>
            ← กลับ
          </button>
        </div>

        {confirm === 'leave' && (
          <div className="confirm-box" role="alertdialog" aria-label="ออกโดยไม่บันทึก">
            <p>มีการแก้ไขที่ยังไม่ได้บันทึก ออกโดยไม่บันทึกไหม</p>
            <div className="confirm-actions">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirm(null)}>
                อยู่ต่อ
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={onClose}>
                ออกโดยไม่บันทึก
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="set-name">ชื่อชุดคำถาม</label>
          <input
            id="set-name"
            type="text"
            placeholder="เช่น คณิตศาสตร์ ป.5 บทที่ 3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={showErrors && !!nameError}
          />
          {showErrors && nameError && <p className="field-error">{nameError}</p>}
        </div>
      </div>

      <QuestionImport room={Math.max(0, 100 - items.filter((i) => i.q.text.trim() || i.q.choices.some((c) => c.trim())).length)} onAdd={addImported} />

      {items.map((item, n) => {
        const err = showErrors ? questionError(item.q) : null;
        const idText = `q${item.key}-text`;
        return (
          <div className="panel" key={item.key}>
            <div className="q-card-top">
              <h3 className="q-title">ข้อ {n + 1}</h3>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => removeQuestion(item.key)}
                disabled={items.length === 1}
                aria-label={`ลบข้อ ${n + 1}`}
              >
                ลบข้อนี้
              </button>
            </div>

            <div className="field">
              <label htmlFor={idText}>โจทย์</label>
              <textarea
                id={idText}
                value={item.q.text}
                placeholder="เช่น 7 × 8 เท่ากับเท่าไร?"
                onChange={(e) => updateQuestion(item.key, { text: e.target.value })}
              />
            </div>

            <fieldset className="choices-set">
              <legend>ตัวเลือก (กดวงกลมหน้าข้อที่เป็นคำตอบถูก)</legend>
              {item.q.choices.map((c, idx) => (
                <div className="choice-row" key={idx}>
                  <input
                    type="radio"
                    name={`correct-${item.key}`}
                    checked={item.q.correctIndex === idx}
                    onChange={() => updateQuestion(item.key, { correctIndex: idx })}
                    aria-label={`ตัวเลือก ${LETTERS[idx]} เป็นคำตอบที่ถูก`}
                  />
                  <span className="choice-letter" aria-hidden="true">{LETTERS[idx]}</span>
                  <input
                    type="text"
                    value={c}
                    placeholder={`ตัวเลือก ${LETTERS[idx]}`}
                    onChange={(e) => updateChoice(item.key, idx, e.target.value)}
                    aria-label={`ข้อ ${n + 1} ตัวเลือก ${LETTERS[idx]}`}
                  />
                </div>
              ))}
            </fieldset>

            <div className="field">
              <label htmlFor={`q${item.key}-diff`}>ความยาก (ยิ่งยากยิ่งทำดาเมจแรง)</label>
              <select
                id={`q${item.key}-diff`}
                value={item.q.difficulty}
                onChange={(e) => updateQuestion(item.key, { difficulty: e.target.value as Difficulty })}
              >
                {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>

            {err && <p className="field-error">ข้อ {n + 1}: {err}</p>}
          </div>
        );
      })}

      <div className="panel">
        <button type="button" className="btn-ghost add-q" onClick={addQuestion}>
          + เพิ่มคำถาม
        </button>

        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          {busy ? 'กำลังบันทึก...' : 'บันทึกชุดคำถาม'}
        </button>

        <div aria-live="polite">
          {showErrors && hasError && <p className="error-text">ยังกรอกไม่ครบ ดูข้อความสีแดงด้านบน</p>}
          {serverError && <p className="error-text">{serverError}</p>}
        </div>

        {setId !== null && (
          <div className="danger-zone">
            {confirm === 'delete' ? (
              <div className="confirm-box" role="alertdialog" aria-label="ยืนยันการลบ">
                <p>ลบชุด "{name}" ถาวร ย้อนกลับไม่ได้</p>
                <div className="confirm-actions">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirm(null)}>
                    ยกเลิก
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={remove} disabled={busy}>
                    ยืนยันลบ
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="link-danger" onClick={() => setConfirm('delete')}>
                ลบชุดคำถามนี้
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
