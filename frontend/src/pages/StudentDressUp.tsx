import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { hasOutfit, loadOutfit, saveOutfit, useOutfit, wearOutfit } from '../api/outfits';
import { avatarImage, CATEGORIES, CUSTOM_FACE, decodeFaceArt, randomOutfit, SKIN_TONES, type Category, type Outfit } from '../game/avatar';
import { FaceDrawer } from './FaceDrawer';
import './dress-up.css';

/** Every category shows this many tiles; the ones without an item yet are "+" placeholders. */
const SLOTS = 12;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Shows each change at once and saves it half a second after the last one, so tapping through
 * many items sends one save, not one per tap. Leaving the page saves whatever is still waiting.
 */
function useAutoSave(studentId: string) {
  const [state, setState] = useState<SaveState>('idle');
  const waiting = useRef<Outfit | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const sending = useRef(false);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (sending.current) return; // the save that is running picks up the newest look when it ends
    sending.current = true;
    try {
      while (waiting.current) {
        const look = waiting.current;
        await saveOutfit(look);
        if (waiting.current === look) {
          waiting.current = null;
          setState('saved');
        }
      }
    } catch {
      setState('error');
    } finally {
      sending.current = false;
    }
  }, []);

  const change = useCallback(
    (next: Outfit) => {
      wearOutfit(studentId, next);
      waiting.current = next;
      setState('saving');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), 500);
    },
    [studentId, flush]
  );

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (waiting.current) void saveOutfit(waiting.current).catch(() => undefined);
    },
    []
  );

  return { state, change, retry: flush };
}

function motionOk(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------- icons (drawn with currentColor)

const CATEGORY_ICON: Record<Category, JSX.Element> = {
  face: (
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.6 8.1c-.8 0-1.4.9-1.4 2s.6 2 1.4 2 1.4-.9 1.4-2-.6-2-1.4-2Zm6.8 0c-.8 0-1.4.9-1.4 2s.6 2 1.4 2 1.4-.9 1.4-2-.6-2-1.4-2ZM7.4 14.7c1 1.9 2.6 2.9 4.6 2.9s3.6-1 4.6-2.9l-1.4-.7c-.7 1.4-1.8 2-3.2 2s-2.5-.6-3.2-2l-1.4.7Z"
    />
  ),
  hair: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V10H3V6.5ZM3.5 11h2v7.5h-2V11Zm3.4 0h2v7.5h-2V11Zm3.4 0h2v7.5h-2V11Zm3.4 0h2v7.5h-2V11Zm3.4 0h2v7.5h-2V11Z" transform="rotate(-38 12 12)" />,
  hat: <path d="M12.5 4.2a1.2 1.2 0 0 0-1.1.8A8 8 0 0 0 4 13v1.5h16V13a8 8 0 0 0-6.4-7.9 1.2 1.2 0 0 0-1.1-.9ZM2.5 16a1.5 1.5 0 0 0 0 3h15.7c1.9 0 3.3-.9 3.8-2.3.2-.4-.1-.7-.5-.7H2.5Z" />,
  top: <path d="M8.3 3 4.6 4.7 1.8 8.6l3 2.9L7 10v11h10V10l2.2 1.5 3-2.9-2.8-3.9L15.7 3c-.6 1.4-2 2.3-3.7 2.3S8.9 4.4 8.3 3Z" />,
  bottom: <path d="M5 4h14l1.5 14h-7.2L12 10.5 10.7 18H3.5L5 4Z" />,
  shoes: <path d="M2 13.2 5.3 7.5l3.2.9c.5 2 2 3.5 4.1 4.1l6.7 1.8c1.6.4 2.7 1.8 2.7 3.4V18H2v-4.8ZM2 19.2h20V21H2v-1.8Z" />,
  accessory: <path d="M2.5 6.3 10 10.3v3.4l-7.5 4V6.3Zm19 0v11.4l-7.5-4v-3.4l7.5-4ZM10.8 9.8h2.4v4.4h-2.4V9.8Z" />,
  bag: (
    <path
      fillRule="evenodd"
      d="M8 5a4 4 0 0 1 8 0v.7a6 6 0 0 1 4 5.6V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.7a6 6 0 0 1 4-5.6V5Zm2 .1h4V5a2 2 0 0 0-4 0v.1ZM8 13v5.5h8V13H8Z"
    />
  )
};

function DiceIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect className="du-dice-edge" x="8" y="12" width="48" height="48" rx="12" />
      <rect className="du-dice-face" x="8" y="5" width="48" height="48" rx="12" />
      {[
        [20, 17],
        [44, 17],
        [32, 29],
        [20, 41],
        [44, 41]
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} className="du-dice-pip" cx={x} cy={y} r="4.6" />
      ))}
    </svg>
  );
}

const lineIcon = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

const ArrowLeft = () => (
  <svg {...lineIcon}>
    <path d="M20 12H5M11 5.5 4.5 12l6.5 6.5" />
  </svg>
);
const Plus = () => (
  <svg {...lineIcon} strokeWidth={3.6}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const Pencil = () => (
  <svg {...lineIcon} strokeWidth={2.2}>
    <path d="m4 20 1-4.5L16.5 4a2 2 0 0 1 3 0l.5.5a2 2 0 0 1 0 3L8.5 19 4 20Z" />
    <path d="m14.5 6 3.5 3.5" />
  </svg>
);
const NoneMark = () => (
  <svg {...lineIcon} strokeWidth={2.4}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 18 12-12" />
  </svg>
);
const Check = () => (
  <svg {...lineIcon}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

// ---------------------------------------------------------------- page

export function StudentDressUp({ studentId, name, onExit }: { studentId: string; name: string; onExit: () => void }) {
  const { outfit, loaded } = useOutfit(studentId);
  const { state, change, retry } = useAutoSave(studentId);
  const [cat, setCat] = useState<Category>('face');
  const [failed, setFailed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const avatarRef = useRef<HTMLImageElement>(null);
  const diceRef = useRef<HTMLButtonElement>(null);
  const info = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0];

  // The editor only opens on the real saved character, so a slow connection can't overwrite it with the default one.
  const load = useCallback(() => {
    setFailed(false);
    void loadOutfit(studentId).then(() => setFailed(!hasOutfit(studentId)));
  }, [studentId]);
  useEffect(() => {
    if (!hasOutfit(studentId)) load();
  }, [studentId, load]);

  function pop() {
    if (!motionOk()) return;
    avatarRef.current?.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.05, 0.955)' }, { transform: 'scale(0.98, 1.025)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'ease-out' }
    );
  }

  function wear(patch: Partial<Outfit>) {
    change({ ...outfit, ...patch });
    pop();
  }

  function roll() {
    change(randomOutfit(outfit));
    pop();
    if (motionOk()) {
      diceRef.current?.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(200deg) scale(1.15)' }, { transform: 'rotate(360deg) scale(1)' }], {
        duration: 460,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
      });
    }
  }

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const at = CATEGORIES.findIndex((c) => c.id === cat);
    const last = CATEGORIES.length - 1;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = at === last ? 0 : at + 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = at === 0 ? last : at - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next < 0) return;
    e.preventDefault();
    setCat(CATEGORIES[next].id);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  }

  const tiles = useMemo(
    () =>
      info.items.map((item) => ({
        item,
        picture:
          item.id === 'none' || (item.id === CUSTOM_FACE && !outfit.faceArt)
            ? null
            : avatarImage({ ...outfit, ...info.hide, [info.id]: item.id }, { view: info.view })
      })),
    [info, outfit]
  );
  const full = useMemo(() => avatarImage(outfit, { shadow: true }), [outfit]);

  return (
    <div className="du-page">
      <div className="du-room" aria-hidden="true" />
      <h1 className="sh-visually-hidden">แต่งตัวละคร</h1>

      <div className="du-top">
        <p className={`du-save is-${state}`} role="status">
          {state === 'saving' && 'กำลังบันทึก…'}
          {state === 'saved' && (
            <>
              <Check />
              บันทึกแล้ว
            </>
          )}
          {state === 'error' && (
            <>
              บันทึกไม่สำเร็จ
              <button type="button" className="du-retry" onClick={() => void retry()}>
                ลองอีกครั้ง
              </button>
            </>
          )}
        </p>
        <button type="button" className="du-exit" onClick={onExit}>
          <ArrowLeft />
          Exit
        </button>
      </div>

      <div className="du-stage">
        <div className="du-avatar-wrap">
          <img ref={avatarRef} className="du-avatar" src={full} alt={`ตัวละครของ ${name}`} />
        </div>
        <button type="button" ref={diceRef} className="du-dice" aria-label="สุ่มชุด" title="สุ่มชุด" disabled={!loaded} onClick={roll}>
          <DiceIcon />
        </button>
      </div>

      <div className="du-cats" role="tablist" aria-label="หมวดของแต่งตัว" aria-orientation="vertical" onKeyDown={onTabKey}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            id={`du-tab-${c.id}`}
            className="du-cat"
            aria-selected={c.id === cat}
            aria-controls="du-panel"
            aria-label={c.label}
            title={c.label}
            tabIndex={c.id === cat ? 0 : -1}
            onClick={() => setCat(c.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {CATEGORY_ICON[c.id]}
            </svg>
          </button>
        ))}
      </div>

      <section className="du-panel" id="du-panel" role="tabpanel" aria-labelledby={`du-tab-${cat}`}>
        {!loaded ? (
          <div className="du-wait">
            {failed ? (
              <>
                <p>โหลดตัวละครไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองใหม่</p>
                <button type="button" className="du-retry" onClick={load}>
                  ลองอีกครั้ง
                </button>
              </>
            ) : (
              <p role="status">กำลังโหลดตัวละคร…</p>
            )}
          </div>
        ) : (
          <div className="du-panel-body" key={cat}>
            <h2 className="du-heading">{info.colorTitle}</h2>
            <div className="du-swatches" role="group" aria-label={`สี${info.label}`}>
              {info.colors.map((color, i) => (
                <button
                  key={color}
                  type="button"
                  className="du-swatch"
                  style={{ '--swatch': color } as CSSProperties}
                  aria-pressed={outfit[info.colorKey] === i}
                  aria-label={info.colorNames[i]}
                  title={info.colorNames[i]}
                  onClick={() => wear({ [info.colorKey]: i } as Partial<Outfit>)}
                />
              ))}
            </div>

            <h2 className="du-heading">{info.title}</h2>
            <div className="du-grid" role="group" aria-label={info.label}>
              {tiles.map(({ item, picture }) => (
                <button
                  key={item.id}
                  type="button"
                  className="du-tile"
                  aria-pressed={outfit[info.id] === item.id}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => (item.id === CUSTOM_FACE ? setDrawing(true) : wear({ [info.id]: item.id } as Partial<Outfit>))}
                >
                  {picture ? <img src={picture} alt="" /> : item.id === CUSTOM_FACE ? <Pencil /> : <NoneMark />}
                  {item.id === CUSTOM_FACE && <span className="du-tile-tag">วาดเอง</span>}
                </button>
              ))}
              {Array.from({ length: Math.max(0, SLOTS - tiles.length) }, (_, i) => (
                <span key={i} className="du-tile du-tile-empty" aria-hidden="true">
                  <Plus />
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {drawing && (
        <FaceDrawer
          skin={SKIN_TONES[outfit.skin]}
          initial={decodeFaceArt(outfit.faceArt)}
          onCancel={() => setDrawing(false)}
          onSave={(art) => {
            setDrawing(false);
            wear({ face: CUSTOM_FACE, faceArt: art });
          }}
        />
      )}
    </div>
  );
}
