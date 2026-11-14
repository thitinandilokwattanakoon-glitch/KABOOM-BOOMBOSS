import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { avatarUrl } from '../api/avatars';
import { loadBossLook, saveBossLook } from '../api/bossLooks';
import { AvatarEditor } from '../components/AvatarEditor';
import { BOSS_CATEGORIES, BOSS_SKINS, bossCanvas, CUSTOM_FACE, decodeFaceArt, defaultBossLook, type BossLook, type BossPart } from '../game/avatar';
import { loadFace } from '../game/chibi';
import { FaceDrawer } from './FaceDrawer';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Dress the boss: the face is the teacher's photo or a cartoon face, then horns, outfit, cape and weapon.
 * Every change shows at once and is saved half a second after the last one.
 */
export function BossEditor({ teacherId, name }: { teacherId: string; name: string }) {
  const [look, setLook] = useState<BossLook | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [part, setPart] = useState<BossPart>('horns');
  const [state, setState] = useState<SaveState>('idle');
  const [drawing, setDrawing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const waiting = useRef<BossLook | null>(null);

  useEffect(() => {
    let alive = true;
    void loadBossLook(teacherId).then((l) => alive && setLook(l));
    return () => {
      alive = false;
    };
  }, [teacherId]);

  useEffect(() => {
    let alive = true;
    void loadFace(avatarUrl(teacherId, photoVersion)).then((img) => alive && setPhoto(img));
    return () => {
      alive = false;
    };
  }, [teacherId, photoVersion]);

  // Leaving the page: do not lose the last change.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (waiting.current) void saveBossLook(waiting.current).catch(() => undefined);
    },
    []
  );

  function push() {
    const sending = waiting.current;
    if (!sending) return;
    saveBossLook(sending)
      .then(() => {
        if (waiting.current === sending) {
          waiting.current = null;
          setState('saved');
        }
      })
      .catch(() => setState('error'));
  }

  function change(patch: Partial<BossLook>) {
    if (!look) return;
    const next = { ...look, ...patch };
    setLook(next);
    waiting.current = next;
    setState('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(push, 500);
  }

  const preview = useMemo(() => (look ? bossCanvas(look, 520, photo).toDataURL('image/png') : null), [look, photo]);
  const usingPhoto = !!look && look.head === 'photo';
  const cats = BOSS_CATEGORIES.filter((c) => !(c.cartoonOnly && usingPhoto));
  const cat = cats.find((c) => c.id === part) ?? cats[0];

  const tiles = useMemo(() => {
    if (!look) return [];
    return cat.items.map((item) => ({
      item,
      picture:
        item.id === 'none' || (item.id === CUSTOM_FACE && !look.faceArt)
          ? null
          : bossCanvas({ ...look, [cat.id]: item.id }, 150, photo).toDataURL('image/png')
    }));
  }, [look, cat, photo]);

  if (!look) {
    return (
      <div className="panel th-boss">
        <h2>ตัวละครบอสของฉัน</h2>
        <div className="spinner" role="status" aria-label="กำลังโหลด" />
      </div>
    );
  }

  return (
    <div className="panel th-boss">
      <div className="panel-head">
        <h2>ตัวละครบอสของฉัน</h2>
        <span className={`be-save is-${state}`} role="status">
          {state === 'saving' && 'กำลังบันทึก…'}
          {state === 'saved' && 'บันทึกแล้ว'}
          {state === 'error' && (
            <button type="button" className="btn-ghost btn-sm" onClick={push}>
              บันทึกไม่สำเร็จ ลองอีกครั้ง
            </button>
          )}
        </span>
      </div>
      <p className="hint">บอสตัวนี้จะปรากฏในทุกห้องที่คุณเปิด เลือกหน้า เขา ชุด ผ้าคลุม และอาวุธได้ตามใจ</p>

      <div className="be-layout">
        <div className="be-preview">{preview && <img src={preview} alt={`ตัวละครบอสของ ${name}`} />}</div>

        <div className="be-controls">
          <div className="be-seg" role="group" aria-label="แบบของหน้าบอส">
            <button type="button" aria-pressed={look.head === 'photo'} onClick={() => change({ head: 'photo' })}>
              ใช้รูปถ่ายเป็นหน้า
            </button>
            <button
              type="button"
              aria-pressed={look.head === 'cartoon'}
              onClick={() => {
                change({ head: 'cartoon' });
                setPart('face');
              }}
            >
              ใช้หน้าการ์ตูน
            </button>
          </div>

          {usingPhoto && (
            <div className="be-photo">
              {!photo && <p className="hint">ยังไม่มีรูปถ่าย ตอนนี้บอสจึงใช้หน้าการ์ตูนแทน เลือกรูปหรือถ่ายรูปด้านล่างได้เลย</p>}
              <AvatarEditor ownerId={teacherId} name={name} kind="boss" version={photoVersion} onSaved={() => setPhotoVersion(Date.now())} />
            </div>
          )}

          <div className="be-tabs" role="tablist" aria-label="ส่วนของตัวละครบอส">
            {cats.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={c.id === cat.id} onClick={() => setPart(c.id)}>
                {c.title}
              </button>
            ))}
          </div>

          {cat.colorKey && (
            <div className="be-swatches" role="group" aria-label={cat.colorTitle}>
              {cat.colors.map((color, i) => (
                <button
                  key={color}
                  type="button"
                  className="be-swatch"
                  style={{ '--swatch': color } as CSSProperties}
                  aria-pressed={look[cat.colorKey!] === i}
                  aria-label={cat.colorNames[i]}
                  title={cat.colorNames[i]}
                  onClick={() => change({ [cat.colorKey!]: i } as Partial<BossLook>)}
                />
              ))}
            </div>
          )}

          <div className="be-grid" role="group" aria-label={cat.title}>
            {tiles.map(({ item, picture }) => (
              <button
                key={item.id}
                type="button"
                className="be-tile"
                aria-pressed={look[cat.id] === item.id}
                aria-label={item.label}
                title={item.label}
                onClick={() => (item.id === CUSTOM_FACE ? setDrawing(true) : change({ [cat.id]: item.id } as Partial<BossLook>))}
              >
                {picture ? <img src={picture} alt="" /> : <span className="be-tile-text">{item.id === CUSTOM_FACE ? 'วาดเอง' : 'ไม่ใส่'}</span>}
                {picture && <span className="be-tile-name">{item.label}</span>}
              </button>
            ))}
          </div>

          <button type="button" className="btn-ghost btn-sm be-reset" onClick={() => change({ ...defaultBossLook(), head: look.head })}>
            กลับไปใช้ชุดเริ่มต้น
          </button>
        </div>
      </div>

      {drawing && (
        <FaceDrawer
          skin={BOSS_SKINS[look.skin]}
          initial={decodeFaceArt(look.faceArt)}
          onCancel={() => setDrawing(false)}
          onSave={(art) => {
            setDrawing(false);
            change({ face: CUSTOM_FACE, faceArt: art });
          }}
        />
      )}
    </div>
  );
}
