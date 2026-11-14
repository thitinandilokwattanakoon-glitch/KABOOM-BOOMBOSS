import { useEffect, useState } from 'react';
import { avatarUrl } from '../api/avatars';

/** The pixel boss face shown until a teacher uploads a picture. */
export function BossFace() {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path className="bf-horn" d="M2 1h2v3H2zM12 1h2v3h-2zM3 0h1v1H3zM12 0h1v1h-1z" />
      <path className="bf-skin" d="M3 4h10v9H3zM4 13h8v1H4z" />
      <path className="bf-eye" d="M4 6h3v2H4zM9 6h3v2H9z" />
      <path className="bf-ink" d="M5 7h1v1H5zM10 7h1v1h-1zM5 11h6v1H5zM4 5h3v1H4zM9 5h3v1H9z" />
    </svg>
  );
}

interface Props {
  ownerId: string;
  name: string;
  /** boss = square frame and the pixel face as fallback; player = round with the first letter as fallback */
  kind: 'boss' | 'player';
  /** pixels, or 'fill' to take the size of the parent box */
  size: number | 'fill';
  version?: number;
}

export function Avatar({ ownerId, name, kind, size, version = 0 }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [ownerId, version]);

  const style = size === 'fill' ? { width: '100%', height: '100%' } : { width: size, height: size };
  const cls = `avatar avatar-${kind}`;

  if (failed) {
    return (
      <span className={`${cls} avatar-empty`} style={style} aria-hidden="true">
        {kind === 'boss' ? <BossFace /> : <span style={{ fontSize: typeof size === 'number' ? size * 0.5 : undefined }}>{[...name.trim()][0] ?? '?'}</span>}
      </span>
    );
  }
  return (
    <img
      className={cls}
      style={style}
      src={avatarUrl(ownerId, version)}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
