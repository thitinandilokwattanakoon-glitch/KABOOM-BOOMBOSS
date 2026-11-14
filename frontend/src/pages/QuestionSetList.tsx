import { useEffect, useState } from 'react';
import { questionSetsApi } from '../api/questionSets';
import type { QuestionSetSummary } from '../types/questionSet';

interface Props {
  onOpen: (id: string | null) => void; // null = create a new set
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function QuestionSetList({ onOpen }: Props) {
  const [sets, setSets] = useState<QuestionSetSummary[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    questionSetsApi
      .list()
      .then(setSets)
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดชุดคำถามไม่สำเร็จ'));
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>ชุดคำถามของฉัน</h2>
        <button type="button" className="btn-primary btn-sm" onClick={() => onOpen(null)}>
          + สร้างชุดใหม่
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!error && sets === null && <div className="spinner" role="status" aria-label="กำลังโหลด" />}

      {sets && sets.length === 0 && (
        <p className="hint">ยังไม่มีชุดคำถาม กด "สร้างชุดใหม่" เพื่อเริ่มชุดแรก</p>
      )}

      {sets && sets.length > 0 && (
        <ul className="set-list">
          {sets.map((s) => (
            <li key={s.id}>
              <button type="button" className="set-row" onClick={() => onOpen(s.id)}>
                <span className="set-name">{s.name}</span>
                <span className="set-meta">
                  {s.questionCount} ข้อ · แก้ไขล่าสุด {formatDate(s.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
