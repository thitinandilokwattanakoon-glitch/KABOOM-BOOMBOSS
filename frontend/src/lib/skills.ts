import type { BossSkillType, PlayerSkill } from '../types/room';

export const PLAYER_SKILL: Record<PlayerSkill, { name: string; detail: (extraSec: number) => string }> = {
  DOUBLE: { name: 'พลังโจมตี +50%', detail: () => 'ถ้าตอบข้อนี้ถูก ดาเมจเพิ่มขึ้น 50% (ตอบผิดสกิลหมดเปล่า)' },
  EXTRA_TIME: { name: 'เวลาเพิ่ม', detail: (s) => `ได้เวลาตอบเพิ่มอีก ${s} วินาทีในข้อนี้` },
  SHIELD: { name: 'โล่ป้องกัน', detail: () => 'ข้อนี้ถ้าตอบผิดคอมโบไม่หาย และบอสจ้องจับผิดคุณไม่ได้' }
};

/** Extra damage (in percent) for a combo of this many correct answers in a row. Same numbers as GameRules.java. */
export function comboBonusPct(combo: number): number {
  return Math.min(40, 10 * Math.max(0, combo - 1));
}

export const BOSS_SKILL: Record<BossSkillType, string> = {
  HEAL: 'บอสฟื้นเลือด',
  SHORTEN: 'บอสเร่งเวลา',
  NERF_TOP: 'บอสจ้องจับผิด'
};
