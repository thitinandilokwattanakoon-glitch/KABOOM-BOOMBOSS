import { useMemo } from 'react';
import { useOutfit } from '../api/outfits';
import { avatarImage, HEAD_VIEW } from '../game/avatar';

/** A small round picture of the dress-up character of a student, beside their name. */
export function PlayerTag({ id, name, size = 28 }: { id: string; name: string; size?: number }) {
  const { outfit } = useOutfit(id);
  const picture = useMemo(() => avatarImage(outfit, { view: HEAD_VIEW }), [outfit]);
  return (
    <span className="player-tag">
      <img className="avatar avatar-player" style={{ width: size, height: size }} src={picture} alt="" />
      <span className="player-name">{name}</span>
    </span>
  );
}
