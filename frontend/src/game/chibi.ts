/**
 * Placeholder chibi characters, drawn with the 2D canvas API.
 * The head is the player's own photo (cropped to a circle); without a photo it gets a cartoon face.
 * Step 2 (the AI chibi picture) will replace these textures.
 */
export type ChibiKind = 'boss' | 'student';

const INK = '#23243a';
const SKIN = '#f6cfb0';
const BLUSH = 'rgba(255, 120, 130, 0.45)';
const SCALE = 2; // draw at 2x so the texture stays sharp when scaled

/** Logical size of each kind (the texture is SCALE times larger). */
export const CHIBI_SIZE: Record<ChibiKind, { w: number; h: number }> = {
  student: { w: 120, h: 172 },
  boss: { w: 190, h: 240 }
};

function outline(ctx: CanvasRenderingContext2D, fill: string, width = 3) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

/** The head: the photo in a circle, or a drawn face. */
function head(ctx: CanvasRenderingContext2D, face: CanvasImageSource | null, cx: number, cy: number, r: number, angry: boolean) {
  ellipse(ctx, cx, cy, r, r);
  ctx.fillStyle = SKIN;
  ctx.fill();
  if (face) {
    ctx.save();
    ellipse(ctx, cx, cy, r, r);
    ctx.clip();
    const img = face as HTMLImageElement;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const side = Math.min(iw, ih);
    ctx.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  } else {
    // hair cap
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(cx, cy - r * 0.35, cx - r * 0.95, cy - r * 0.3);
    ctx.fillStyle = angry ? '#3a2340' : '#3b2a22';
    ctx.fill();
    // eyes
    const ex = r * 0.38;
    const ey = cy + r * 0.12;
    for (const s of [-1, 1]) {
      ellipse(ctx, cx + s * ex, ey, r * 0.13, r * 0.18);
      ctx.fillStyle = INK;
      ctx.fill();
      ellipse(ctx, cx + s * ex - r * 0.04, ey - r * 0.07, r * 0.05, r * 0.05);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ellipse(ctx, cx + s * r * 0.6, ey + r * 0.28, r * 0.15, r * 0.09);
      ctx.fillStyle = BLUSH;
      ctx.fill();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    if (angry) {
      // eyebrows and a toothy grin
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.18, ey - r * 0.22);
        ctx.lineTo(cx + s * r * 0.58, ey - r * 0.36);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.3, cy + r * 0.52);
      ctx.quadraticCurveTo(cx, cy + r * 0.72, cx + r * 0.3, cy + r * 0.52);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.42, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  ellipse(ctx, cx, cy, r, r);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawStudent(ctx: CanvasRenderingContext2D, face: CanvasImageSource | null) {
  const cx = 60;
  // legs and shoes
  for (const s of [-1, 1]) {
    roundRect(ctx, cx + s * 13 - 8, 130, 16, 26, 6);
    outline(ctx, SKIN);
    ellipse(ctx, cx + s * 14, 158, 13, 7);
    outline(ctx, '#2f2f3a');
  }
  // shorts
  roundRect(ctx, cx - 26, 118, 52, 22, 8);
  outline(ctx, '#283a7a');
  // arms
  for (const s of [-1, 1]) {
    ellipse(ctx, cx + s * 30, 108, 9, 17, s * -0.35);
    outline(ctx, '#ffffff');
    ellipse(ctx, cx + s * 35, 122, 7, 7);
    outline(ctx, SKIN);
  }
  // shirt
  roundRect(ctx, cx - 25, 88, 50, 38, 12);
  outline(ctx, '#ffffff');
  // collar + badge
  ctx.beginPath();
  ctx.moveTo(cx - 12, 89);
  ctx.lineTo(cx, 100);
  ctx.lineTo(cx + 12, 89);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ellipse(ctx, cx + 12, 108, 4, 4);
  outline(ctx, '#3d63d9', 2);
  head(ctx, face, cx, 52, 42, false);
}

function drawBoss(ctx: CanvasRenderingContext2D, face: CanvasImageSource | null) {
  const cx = 95;
  // cape
  ctx.beginPath();
  ctx.moveTo(cx - 40, 118);
  ctx.quadraticCurveTo(cx - 78, 190, cx - 66, 222);
  ctx.lineTo(cx + 66, 222);
  ctx.quadraticCurveTo(cx + 78, 190, cx + 40, 118);
  ctx.closePath();
  outline(ctx, '#3a1859');
  // legs
  for (const s of [-1, 1]) {
    ellipse(ctx, cx + s * 18, 224, 17, 9);
    outline(ctx, '#1f1f2b');
  }
  // robe
  ctx.beginPath();
  ctx.moveTo(cx - 32, 122);
  ctx.lineTo(cx - 44, 218);
  ctx.lineTo(cx + 44, 218);
  ctx.lineTo(cx + 32, 122);
  ctx.closePath();
  outline(ctx, '#6a35a0');
  // belt
  roundRect(ctx, cx - 38, 166, 76, 12, 4);
  outline(ctx, '#e8b84a');
  // ruler in the right hand
  ctx.save();
  ctx.translate(cx + 52, 150);
  ctx.rotate(-0.55);
  roundRect(ctx, -6, -62, 12, 86, 3);
  outline(ctx, '#f4d35e');
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-6, -54 + i * 11);
    ctx.lineTo(-1, -54 + i * 11);
    ctx.stroke();
  }
  ctx.restore();
  // arms
  for (const s of [-1, 1]) {
    ellipse(ctx, cx + s * 42, 146, 11, 22, s * -0.5);
    outline(ctx, '#6a35a0');
    ellipse(ctx, cx + s * 50, 164, 9, 9);
    outline(ctx, SKIN);
  }
  // gold collar
  ctx.beginPath();
  ctx.moveTo(cx - 34, 120);
  ctx.lineTo(cx, 140);
  ctx.lineTo(cx + 34, 120);
  ctx.lineTo(cx + 22, 116);
  ctx.lineTo(cx, 128);
  ctx.lineTo(cx - 22, 116);
  ctx.closePath();
  outline(ctx, '#e8b84a');
  // horns (behind the top of the head)
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 26, 30);
    ctx.quadraticCurveTo(cx + s * 52, 8, cx + s * 50, -2 + 8);
    ctx.quadraticCurveTo(cx + s * 44, 26, cx + s * 42, 44);
    ctx.closePath();
    outline(ctx, '#d64545');
  }
  head(ctx, face, cx, 72, 56, true);
}

/** Draw one chibi and return the canvas (SCALE x the logical size). */
export function makeChibi(face: CanvasImageSource | null, kind: ChibiKind): HTMLCanvasElement {
  const { w, h } = CHIBI_SIZE[kind];
  const canvas = document.createElement('canvas');
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(SCALE, SCALE);
  ctx.lineJoin = 'round';
  if (kind === 'boss') drawBoss(ctx, face);
  else drawStudent(ctx, face);
  return canvas;
}

/** Load an uploaded picture as an image that can be drawn onto a canvas (null when there is none). */
export async function loadFace(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const blobUrl = URL.createObjectURL(await res.blob());
    const img = new Image();
    img.src = blobUrl;
    await img.decode();
    return img;
  } catch {
    return null;
  }
}
