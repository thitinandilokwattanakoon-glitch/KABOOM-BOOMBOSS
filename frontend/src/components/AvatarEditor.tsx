import { useEffect, useRef, useState } from 'react';
import { avatarApi } from '../api/avatars';
import { fileToSquareJpeg, squareJpeg } from '../lib/image';
import { Avatar } from './Avatar';

/** A live camera has no still frame, so the poster is an empty pixel until the stream starts. */
const BLANK_POSTER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

interface Props {
  ownerId: string;
  name: string;
  kind: 'boss' | 'player';
  version: number;
  onSaved: () => void;
}

/** Choose a picture from the device or take one with the camera, preview the square crop, then save it. */
export function AvatarEditor({ ownerId, name, kind, version, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  }
  useEffect(() => stopCamera, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      setDraft(await fileToSquareJpeg(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปิดรูปไม่ได้');
    }
  }

  async function openCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('เบราว์เซอร์นี้เปิดกล้องไม่ได้ (ต้องใช้ผ่าน localhost หรือ https) ลองเลือกรูปจากเครื่องแทน');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCamera(true);
    } catch {
      setError('เปิดกล้องไม่ได้ ตรวจว่าอนุญาตให้ใช้กล้องแล้ว หรือเลือกรูปจากเครื่องแทน');
    }
  }

  // The <video> element only exists once `camera` is true, so attach the stream afterwards.
  useEffect(() => {
    if (camera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [camera]);

  function snap() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setDraft(squareJpeg(v, v.videoWidth, v.videoHeight));
    stopCamera();
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError('');
    try {
      await avatarApi.save(draft);
      setDraft(null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกรูปไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-editor">
      {camera ? (
        <div className="camera">
          <video ref={videoRef} poster={BLANK_POSTER} playsInline muted aria-label="ภาพจากกล้อง" />
          <div className="row-actions">
            <button type="button" className="btn-primary btn-sm" onClick={snap}>
              ถ่ายรูป
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={stopCamera}>
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="avatar-stage">
            {draft ? (
              <img className={`avatar avatar-${kind}`} style={{ width: 112, height: 112 }} src={draft} alt="ตัวอย่างรูปที่เลือก" />
            ) : (
              <Avatar ownerId={ownerId} name={name} kind={kind} size={112} version={version} />
            )}
          </div>
          {draft ? (
            <div className="row-actions">
              <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={save}>
                {busy ? 'กำลังบันทึก…' : 'บันทึกรูปนี้'}
              </button>
              <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => setDraft(null)}>
                เลือกใหม่
              </button>
            </div>
          ) : (
            <div className="row-actions">
              <button type="button" className="btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                เลือกรูปจากเครื่อง
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={openCamera}>
                ถ่ายจากกล้อง
              </button>
            </div>
          )}
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
