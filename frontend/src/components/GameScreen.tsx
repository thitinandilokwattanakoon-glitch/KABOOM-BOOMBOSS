import { useEffect, useRef, type ReactNode } from 'react';
import type Phaser from 'phaser';
import type { RoomView } from '../types/room';
import type { Bridge } from '../game/BattleField';
import './game-night.css';

/** Boss name plate: name, chapter being tested, health. Kept in HTML so Thai text stays sharp and readable. */
function HpPlate({ room }: { room: RoomView }) {
  const pct = room.maxHp > 0 ? Math.max(0, Math.min(100, (room.hp / room.maxHp) * 100)) : 0;
  const tone = pct > 50 ? 'ok' : pct > 20 ? 'mid' : 'low';
  return (
    <div className="status-card">
      <div className="status-top">
        <div className="status-name">{room.bossName}</div>
        <div className="status-chapter" title={room.setName}>
          บท {room.setName}
        </div>
      </div>
      <div className="hp-row">
        <span className="hp-label">HP</span>
        <div className="hp-track" role="progressbar" aria-label="เลือดบอส" aria-valuemin={0} aria-valuemax={room.maxHp} aria-valuenow={room.hp}>
          <div className={`hp-fill ${tone}`} style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
        </div>
      </div>
      <div className="hp-text">
        {room.hp.toLocaleString('th-TH')} / {room.maxHp.toLocaleString('th-TH')}
      </div>
    </div>
  );
}

/** The Phaser canvas. The engine is loaded only when a game screen opens. */
function GameStage({ room, me }: { room: RoomView; me?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const bridge = useRef<Bridge>({
    room,
    me,
    reduced: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  });

  useEffect(() => {
    let dead = false;
    void import('../game/BattleField').then(({ createGame }) => {
      if (dead || !host.current) return;
      game.current = createGame(host.current, bridge.current);
    });
    return () => {
      dead = true;
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  useEffect(() => {
    bridge.current.room = room;
    bridge.current.me = me;
    game.current?.events.emit('room');
  }, [room, me]);

  return <div ref={host} className="game-canvas" aria-hidden="true" />;
}

/** Full-screen game: the battle field on top, the text box, choices and buttons underneath. */
export function GameScreen({ room, me, children }: { room: RoomView; me?: string; children: ReactNode }) {
  return (
    <div className="game-screen">
      <section className="game-stage" aria-label={`สนามต่อสู้กับ ${room.bossName}`}>
        <GameStage room={room} me={me} />
        <HpPlate room={room} />
      </section>
      <div className="game-ui">
        <div className="game-ui-inner">{children}</div>
      </div>
    </div>
  );
}
