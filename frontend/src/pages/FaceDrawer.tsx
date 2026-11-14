import { useEffect, useRef, useState, type PointerEvent } from 'react';
import './dress-up.css';
import { encodeFaceArt, FACE_ART_MAX, FACE_BOX, HEAD, INK, PEN_WIDTHS, type FaceStroke } from '../game/avatar';

/** Middle of the head in the 200 x 300 character box. */
const CX = 100;
const CY = 103;
const HEAD_W = 156;
const HEAD_H = 138;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function strokePath(points: number[]): string {
  let d = `M${points[0]} ${points[1]}`;
  if (points.length === 2) d += `L${points[0] + 0.01} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) d += `L${points[i]} ${points[i + 1]}`;
  return d;
}

/**
 * Draw your own face. A photo (taken now or picked from the device) can be shown faintly on the head as
 * a guide to trace over. Only the drawn lines are kept: the photo never leaves this device.
 */
export function FaceDrawer({ skin, initial, onSave, onCancel }: {
  skin: string;
  initial: FaceStroke[];
  onSave: (art: string) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [strokes, setStrokes] = useState<FaceStroke[]>(initial);
  const [live, setLive] = useState<FaceStroke | null>(null);
  const [pen, setPen] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [shift, setShift] = useState(0);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  // The photo is only a local preview; free it when it is replaced or the drawer closes.
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  function toBox(e: PointerEvent<SVGSVGElement>): [number, number] | null {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    return [Math.round(clamp(p.x, FACE_BOX[0], FACE_BOX[2]) * 2) / 2, Math.round(clamp(p.y, FACE_BOX[1], FACE_BOX[3]) * 2) / 2];
  }

  function down(e: PointerEvent<SVGSVGElement>) {
    const p = toBox(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFull(false);
    setLive({ pen, points: p });
  }

  function move(e: PointerEvent<SVGSVGElement>) {
    if (!live) return;
    const p = toBox(e);
    if (!p) return;
    const n = live.points.length;
    // skip points that barely moved, so a drawing stays small
    if (Math.hypot(p[0] - live.points[n - 2], p[1] - live.points[n - 1]) < 1.5) return;
    setLive({ pen: live.pen, points: [...live.points, ...p] });
  }

  function up() {
    if (!live) return;
    const next = [...strokes, live];
    setLive(null);
    if (encodeFaceArt(next).length > FACE_ART_MAX) setFull(true);
    else setStrokes(next);
  }

  function pickPhoto(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    setPhoto(URL.createObjectURL(file));
  }

  const w = HEAD_W * zoom;
  const h = HEAD_H * zoom;
  const shown = live ? [...strokes, live] : strokes;

  return (
    <dialog
      ref={dialogRef}
      className="du-draw"
      aria-labelledby="du-draw-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="du-draw-title" className="du-heading">
        วาดหน้าเอง
      </h2>
      <p className="du-draw-note">ถ่ายหรือเลือกรูปเป็นแบบ แล้ววาดเส้นตา คิ้ว จมูก ปากทับได้เลย รูปใช้เป็นแบบวาดเท่านั้น ไม่ถูกบันทึกและไม่ออกจากเครื่องนี้</p>

      <svg
        ref={svgRef}
        className="du-draw-pad"
        viewBox="14 26 172 154"
        role="img"
        aria-label="พื้นที่วาดหน้า"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <defs>
          <clipPath id="du-head-clip">
            <path d={HEAD} />
          </clipPath>
        </defs>
        <path d={HEAD} fill={skin} />
        {photo && (
          <image
            href={photo}
            x={CX - w / 2}
            y={CY - h / 2 + shift}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#du-head-clip)"
            opacity="0.55"
          />
        )}
        <g fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
          {shown.map((s, i) => (
            <path key={i} d={strokePath(s.points)} strokeWidth={PEN_WIDTHS[s.pen]} />
          ))}
          <path d={HEAD} strokeWidth="4" />
        </g>
      </svg>

      <div className="du-draw-tools">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        <button type="button" className="du-tool" onClick={() => fileRef.current?.click()}>
          {photo ? 'เปลี่ยนรูป' : 'ถ่ายรูป / เลือกรูป'}
        </button>
        {photo && (
          <button type="button" className="du-tool" onClick={() => setPhoto(null)}>
            เอารูปออก
          </button>
        )}
        <span className="du-pens" role="group" aria-label="ขนาดปากกา">
          {PEN_WIDTHS.map((width, i) => (
            <button key={width} type="button" className="du-pen" aria-pressed={pen === i} aria-label={['เส้นเล็ก', 'เส้นกลาง', 'เส้นใหญ่'][i]} onClick={() => setPen(i)}>
              <span style={{ width: width * 2 + 2, height: width * 2 + 2 }} />
            </button>
          ))}
        </span>
        <button type="button" className="du-tool" disabled={strokes.length === 0} onClick={() => setStrokes(strokes.slice(0, -1))}>
          ย้อนกลับ
        </button>
        <button type="button" className="du-tool" disabled={strokes.length === 0} onClick={() => setStrokes([])}>
          ล้าง
        </button>
      </div>

      {photo && (
        <div className="du-draw-sliders">
          <label>
            ขยายรูป
            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          <label>
            เลื่อนขึ้นลง
            <input type="range" min="-60" max="60" step="1" value={shift} onChange={(e) => setShift(Number(e.target.value))} />
          </label>
        </div>
      )}

      {full && (
        <p className="du-draw-full" role="alert">
          เส้นเต็มแล้ว ลองย้อนกลับหรือลบบางเส้นก่อนวาดเพิ่ม
        </p>
      )}

      <div className="du-draw-actions">
        <button type="button" className="du-tool" onClick={onCancel}>
          ยกเลิก
        </button>
        <button type="button" className="du-tool is-main" disabled={strokes.length === 0} onClick={() => onSave(encodeFaceArt(strokes))}>
          ใช้หน้านี้
        </button>
      </div>
    </dialog>
  );
}
