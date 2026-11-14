export const AVATAR_SIZE = 256;

/** Crops the middle square of a picture or camera frame and shrinks it, as a JPEG data URL (about 20-40 KB). */
export function squareJpeg(source: CanvasImageSource, width: number, height: number, size = AVATAR_SIZE): string {
  const side = Math.min(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('เบราว์เซอร์นี้แปลงรูปไม่ได้');
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** Reads a picture file the user chose and returns the cropped square. Throws a Thai message when it is not a picture. */
export async function fileToSquareJpeg(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพ');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('เปิดรูปนี้ไม่ได้ ลองไฟล์ JPEG หรือ PNG');
  });
  try {
    return squareJpeg(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}
