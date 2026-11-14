import Phaser from 'phaser';
import { avatarUrl } from '../api/avatars';
import { loadBossLook } from '../api/bossLooks';
import { loadOutfit } from '../api/outfits';
import type { BossSkillType, ResultView, RoomView } from '../types/room';
import { avatarCanvas, bossCanvas, defaultBossLook, defaultOutfit } from './avatar';
import { CHIBI_SIZE, loadFace } from './chibi';

/** Student textures are drawn twice as tall as they are shown, like the chibi ones, so `layout()` treats both alike. */
const STUDENT_TEX_H = CHIBI_SIZE.student.h * 2;
const BOSS_TEX_H = CHIBI_SIZE.boss.h * 2;

/** Shared object React writes into; the scene reads it whenever the game emits 'room'. */
export interface Bridge {
  room: RoomView | null;
  me?: string;
  reduced: boolean;
}

const COLOR = {
  // night arena
  sky: 0x070d22,
  skyLow: 0x1a2f6b,
  grass: 0x1b2a5c,
  grassLow: 0x0a1230,
  stripe: 0x63e8ff,
  hill: 0x101c44,
  plat: 0x2b4a9c,
  platEdge: 0x0f1f52,
  platGlow: 0x63e8ff,
  bossGlow: 0xff5a7a,
  star: 0xffffff,
  shadow: 0x02040e,
  ink: 0x23243a,
  good: 0x2fbf71,
  bad: 0xe5484d,
  gold: 0xffd23f,
  hit: 0xfff1a8,
  double: 0xffb000,
  nerf: 0x9b5de5,
  extra: 0x4cc9f0,
  shield: 0x7dffc0
};
const SKILL_COLOR: Record<BossSkillType, number> = { HEAL: 0x2fbf71, SHORTEN: 0xff8a3d, NERF_TOP: 0x9b5de5 };

interface Fighter {
  id: string;
  name: string;
  c: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  marker: Phaser.GameObjects.Triangle | null;
  badge: Phaser.GameObjects.Container | null;
  aura: Phaser.GameObjects.Ellipse | null;
  h: number;
  hasFace: boolean;
}

export class BattleField extends Phaser.Scene {
  private bridge: Bridge;
  private prev: RoomView | null = null;
  private font = 'sans-serif';
  private bg!: Phaser.GameObjects.Graphics;
  private crowdPlat!: Phaser.GameObjects.Graphics;
  private bossC!: Phaser.GameObjects.Container;
  private bossBody!: Phaser.GameObjects.Image;
  private bossPlat!: Phaser.GameObjects.Graphics;
  private bossH = 200;
  private bossFaceFor = '';
  private bossDown = false;
  private fighters = new Map<string, Fighter>();
  private texSeq = 0;
  private ready = false;

  constructor(bridge: Bridge) {
    super('battle');
    this.bridge = bridge;
  }

  create() {
    this.font = getComputedStyle(document.body).fontFamily || 'sans-serif';

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8).generateTexture('dot', 16, 16);
    g.clear().fillStyle(0xffffff, 1).fillEllipse(40, 26, 50, 30).fillEllipse(70, 22, 50, 34).fillEllipse(100, 28, 46, 26).generateTexture('cloud', 130, 50);
    g.destroy();

    // Students are dress-up characters (game/avatar.ts); the boss is still the chibi with the photo of the teacher.
    this.textures.addCanvas('chibi-student', avatarCanvas(defaultOutfit(), STUDENT_TEX_H));
    this.textures.addCanvas('chibi-boss', bossCanvas(defaultBossLook(), BOSS_TEX_H));

    this.bg = this.add.graphics().setDepth(-100);
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.image(0, 0, 'cloud').setDepth(-90).setAlpha(0.1).setTint(0x9fb6ff);
      cloud.setData('slot', i);
      if (!this.bridge.reduced) {
        this.tweens.add({ targets: cloud, x: '+=60', duration: 6000 + i * 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    this.crowdPlat = this.add.graphics().setDepth(-50);

    this.bossPlat = this.add.graphics();
    this.bossBody = this.add.image(0, 0, 'chibi-boss').setOrigin(0.5, 1);
    this.bossC = this.add.container(0, 0, [this.bossPlat, this.bossBody]);
    if (!this.bridge.reduced) {
      this.tweens.add({ targets: this.bossBody, scaleY: '*=1.03', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.scale.on('resize', () => this.layout());
    this.game.events.on('room', this.onRoom, this);
    this.events.once('shutdown', () => {
      this.ready = false;
      this.game.events.off('room', this.onRoom, this);
    });
    this.events.once('destroy', () => (this.ready = false));
    this.ready = true;

    this.layout();
    this.onRoom();
  }

  // ---------------------------------------------------------------- layout

  private layout() {
    const W = this.scale.width;
    const H = this.scale.height;
    const narrow = W < 640;
    const horizon = H * 0.4;

    // Night arena: starry sky, dark stands on the horizon, a floor with faint light lines.
    this.bg.clear();
    this.bg.fillGradientStyle(COLOR.sky, COLOR.sky, COLOR.skyLow, COLOR.skyLow, 1).fillRect(0, 0, W, horizon);
    this.bg.fillStyle(COLOR.star, 1);
    for (let i = 0; i < 46; i++) {
      // fixed pseudo-random spots, so the stars do not jump when the window is resized
      const sx = ((i * 7919) % 997) / 997;
      const sy = ((i * 104729) % 991) / 991;
      this.bg.fillStyle(COLOR.star, 0.25 + ((i * 31) % 60) / 100);
      this.bg.fillCircle(sx * W, sy * horizon * 0.9, i % 7 === 0 ? 1.8 : 1);
    }
    this.bg.fillStyle(COLOR.hill, 1);
    for (let i = 0; i < 4; i++) this.bg.fillEllipse((W / 3) * i, horizon + 6, W * 0.55, H * 0.16);
    this.bg.fillGradientStyle(COLOR.grass, COLOR.grass, COLOR.grassLow, COLOR.grassLow, 1).fillRect(0, horizon, W, H - horizon);
    this.bg.fillStyle(COLOR.stripe, 0.05);
    for (let y = horizon + 16; y < H; y += 26) this.bg.fillRect(0, y, W, 2);
    this.bg.fillStyle(COLOR.stripe, 0.22).fillRect(0, horizon, W, 2);

    this.children.list
      .filter((o) => o instanceof Phaser.GameObjects.Image && o.texture.key === 'cloud')
      .forEach((o) => {
        const c = o as Phaser.GameObjects.Image;
        const slot = c.getData('slot') as number;
        c.setPosition(W * (0.15 + slot * 0.3), H * (0.08 + (slot % 2) * 0.1));
        c.setScale(Math.max(0.5, Math.min(1.2, W / 900)));
      });

    // boss: upper right, standing on its platform
    this.bossH = Math.min(H * 0.52, W * (narrow ? 0.46 : 0.3));
    const bossScale = this.bossH / CHIBI_SIZE.boss.h / 2;
    this.bossBody.setScale(bossScale);
    this.bossC.setPosition(W * (narrow ? 0.74 : 0.73), H * (narrow ? 0.6 : 0.56));
    this.bossC.setDepth(this.bossC.y);
    this.bossPlat.clear();
    const pw = this.bossH * 1.15;
    const ph = this.bossH * 0.2;
    this.bossPlat.fillStyle(COLOR.shadow, 0.5).fillEllipse(0, ph * 0.25, pw, ph);
    this.bossPlat.fillStyle(COLOR.bossGlow, 0.22).fillEllipse(0, ph * 0.1, pw * 1.12, ph * 1.25);
    this.bossPlat.fillStyle(COLOR.platEdge, 1).fillEllipse(0, ph * 0.12, pw, ph);
    this.bossPlat.fillStyle(COLOR.plat, 1).fillEllipse(0, 0, pw, ph * 0.9);
    this.bossPlat.lineStyle(2, COLOR.bossGlow, 0.9).strokeEllipse(0, 0, pw, ph * 0.9);

    this.layoutCrowd();
  }

  private layoutCrowd() {
    const W = this.scale.width;
    const H = this.scale.height;
    const narrow = W < 640;
    const list = [...this.fighters.values()];
    const x0 = W * 0.04;
    const areaW = W * (narrow ? 0.56 : 0.54);
    const top = H * 0.6;
    const areaH = H * 0.37;

    this.crowdPlat.clear();
    this.crowdPlat.fillStyle(COLOR.shadow, 0.5).fillEllipse(x0 + areaW / 2, top + areaH * 0.62, areaW * 1.08, areaH * 0.95);
    this.crowdPlat.fillStyle(COLOR.platGlow, 0.14).fillEllipse(x0 + areaW / 2, top + areaH * 0.57, areaW * 1.12, areaH * 1.0);
    this.crowdPlat.fillStyle(COLOR.platEdge, 1).fillEllipse(x0 + areaW / 2, top + areaH * 0.58, areaW * 1.06, areaH * 0.92);
    this.crowdPlat.fillStyle(COLOR.plat, 1).fillEllipse(x0 + areaW / 2, top + areaH * 0.55, areaW * 1.04, areaH * 0.86);
    this.crowdPlat.lineStyle(2, COLOR.platGlow, 0.8).strokeEllipse(x0 + areaW / 2, top + areaH * 0.55, areaW * 1.04, areaH * 0.86);
    if (list.length === 0) return;

    // Pick the column count that gives the biggest characters.
    let best = { cols: 1, rows: 1, h: 0 };
    for (let cols = 1; cols <= list.length; cols++) {
      const rows = Math.ceil(list.length / cols);
      const h = Math.min(areaH / (rows * 0.55 + 0.6), areaW / (cols * 0.62));
      if (h > best.h) best = { cols, rows, h };
    }
    const h = Math.min(best.h, H * 0.3, 130);
    const rowStep = best.rows > 1 ? (areaH - h * 0.15) / best.rows : 0;
    const colW = areaW / best.cols;
    const showLabels = h >= 54;

    list.forEach((f, i) => {
      const row = Math.floor(i / best.cols);
      const col = i % best.cols;
      const x = x0 + colW * (col + 0.5) + (row % 2 ? colW * 0.25 : 0);
      const y = top + h * 0.55 + row * rowStep + (best.rows === 1 ? areaH * 0.25 : 0);
      f.h = h;
      f.c.setPosition(x, y).setDepth(y);
      f.c.setData('home', { x, y });
      f.body.setScale(h / CHIBI_SIZE.student.h / 2);
      f.label.setFontSize(Math.max(11, Math.min(15, h * 0.13)));
      f.label.setVisible(showLabels || f.id === this.bridge.me);
      f.marker?.setPosition(0, -h - 14);
      f.badge?.setPosition(h * 0.3, -h * 0.95);
      f.aura?.setSize(h * 0.9, h * 0.28);
    });
  }

  // ---------------------------------------------------------------- sync

  private onRoom() {
    const r = this.bridge.room;
    if (!r || !this.ready) return;
    const prev = this.prev;

    this.syncBossFace(r.teacherId);
    const added = this.syncFighters(r);
    if (added.length || (prev && prev.players.length !== r.players.length)) this.layoutCrowd();

    const newQuestion = r.status === 'QUESTION' && (!prev || prev.status !== 'QUESTION' || prev.questionIndex !== r.questionIndex);
    const newReveal = r.status === 'REVEAL' && !!r.reveal && (!prev || prev.status !== 'REVEAL' || prev.questionIndex !== r.questionIndex);
    const ended = r.status === 'ENDED' && (!prev || prev.status !== 'ENDED');

    if (r.status === 'LOBBY' && prev) added.forEach((f) => this.dropIn(f));

    if (newQuestion) {
      this.resetFighters();
      if (this.bossDown) this.reviveBoss();
      if (prev && r.bossSkill) this.castBossSkill(r);
      else if (r.bossSkill?.type === 'NERF_TOP' && r.bossSkill.targetId) this.fighters.get(r.bossSkill.targetId)?.body.setTint(COLOR.nerf);
    }
    if (r.status === 'QUESTION') {
      const before = new Set(newQuestion ? [] : prev?.answeredIds ?? []);
      r.answeredIds.filter((id) => !before.has(id)).forEach((id) => {
        const f = this.fighters.get(id);
        if (!f) return;
        this.setBadge(f, 'wait');
        if (prev && !newQuestion) this.hop(f.body);
      });
      const skillsBefore = new Set(newQuestion ? [] : (prev?.activeSkills ?? []).map((a) => a.playerId));
      r.activeSkills.forEach((a) => {
        const f = this.fighters.get(a.playerId);
        if (f && !f.aura) this.setAura(f, a.skill === 'DOUBLE' ? COLOR.double : a.skill === 'SHIELD' ? COLOR.shield : COLOR.extra, !skillsBefore.has(a.playerId) && !!prev);
      });
    }
    if (newReveal && r.reveal) {
      if (prev) this.playReveal(r);
      else this.showResults(r.reveal.results);
    }
    if (ended) {
      if (prev) this.playEnd(!!r.victory);
      else if (r.victory) this.hideBoss();
    }
    this.prev = r;
  }

  private syncBossFace(teacherId: string) {
    if (this.bossFaceFor === teacherId) return;
    this.bossFaceFor = teacherId;
    // The boss wears what the teacher chose; the photo is only needed when the look uses it as the face.
    void Promise.all([loadBossLook(teacherId), loadFace(avatarUrl(teacherId))]).then(([look, img]) => {
      if (!this.ready) return;
      const key = `boss-look-${++this.texSeq}`;
      this.textures.addCanvas(key, bossCanvas(look, BOSS_TEX_H, img));
      if (img) URL.revokeObjectURL(img.src);
      this.bossBody.setTexture(key);
    });
  }

  private syncFighters(r: RoomView): Fighter[] {
    const ids = new Set(r.players.map((p) => p.id));
    for (const [id, f] of this.fighters) {
      if (!ids.has(id)) {
        f.c.destroy();
        this.fighters.delete(id);
      }
    }
    const added: Fighter[] = [];
    r.players.forEach((p) => {
      if (this.fighters.has(p.id)) return;
      const body = this.add.image(0, 0, 'chibi-student').setOrigin(0.5, 1);
      const isMe = p.id === this.bridge.me;
      const label = this.add
        .text(0, 6, [...p.name].slice(0, 12).join(''), {
          fontFamily: this.font,
          fontSize: '13px',
          color: isMe ? '#ffe066' : '#ffffff',
          stroke: '#23243a',
          strokeThickness: 4,
          fontStyle: isMe ? 'bold' : 'normal',
          padding: { top: 6, bottom: 3 }
        })
        .setOrigin(0.5, 0)
        .setResolution(Math.min(2, window.devicePixelRatio || 1));
      const marker = isMe ? this.add.triangle(0, 0, 0, 0, 16, 0, 8, 12, COLOR.gold).setStrokeStyle(2, COLOR.ink) : null;
      const parts: Phaser.GameObjects.GameObject[] = [body, label];
      if (marker) parts.push(marker);
      const c = this.add.container(0, 0, parts);
      const f: Fighter = { id: p.id, name: p.name, c, body, label, marker, badge: null, aura: null, h: 80, hasFace: false };
      this.fighters.set(p.id, f);
      added.push(f);
      if (!this.bridge.reduced) {
        this.tweens.add({ targets: body, y: -4, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 600 });
        if (marker) this.tweens.add({ targets: marker, y: '-=6', duration: 500, yoyo: true, repeat: -1 });
      }
      // Ask the server again each time someone joins, so a look changed just before joining shows up.
      void loadOutfit(p.id, true).then((outfit) => {
        if (!this.fighters.has(p.id) || !this.ready) return;
        const key = `avatar-${p.id}-${++this.texSeq}`;
        this.textures.addCanvas(key, avatarCanvas(outfit, STUDENT_TEX_H));
        body.setTexture(key);
        f.hasFace = true;
      });
    });
    return added;
  }

  // ---------------------------------------------------------------- small effects

  private hop(target: Phaser.GameObjects.Image) {
    this.tweens.add({ targets: target, y: '-=18', duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }

  private dropIn(f: Fighter) {
    const home = f.c.getData('home') as { x: number; y: number };
    f.c.y = home.y - this.scale.height * 0.6;
    f.c.alpha = 0;
    this.tweens.add({ targets: f.c, y: home.y, alpha: 1, duration: 700, ease: 'Bounce.easeOut' });
  }

  private setBadge(f: Fighter, kind: 'wait' | 'ok' | 'no') {
    f.badge?.destroy();
    const r = Math.max(9, f.h * 0.13);
    const color = kind === 'ok' ? COLOR.good : kind === 'no' ? COLOR.bad : 0x3d63d9;
    const g = this.add.graphics();
    g.fillStyle(color, 1).fillCircle(0, 0, r).lineStyle(2, 0xffffff, 1).strokeCircle(0, 0, r);
    g.lineStyle(Math.max(2, r * 0.28), 0xffffff, 1);
    if (kind === 'no') {
      g.lineBetween(-r * 0.4, -r * 0.4, r * 0.4, r * 0.4).lineBetween(r * 0.4, -r * 0.4, -r * 0.4, r * 0.4);
    } else if (kind === 'ok') {
      g.beginPath().moveTo(-r * 0.45, 0).lineTo(-r * 0.1, r * 0.35).lineTo(r * 0.45, -r * 0.35).strokePath();
    } else {
      g.fillStyle(0xffffff, 1).fillCircle(-r * 0.4, 0, r * 0.14).fillCircle(0, 0, r * 0.14).fillCircle(r * 0.4, 0, r * 0.14);
    }
    const badge = this.add.container(f.h * 0.3, -f.h * 0.95, [g]);
    f.c.add(badge);
    f.badge = badge;
    badge.setScale(0);
    this.tweens.add({ targets: badge, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  private setAura(f: Fighter, color: number, animate: boolean) {
    const aura = this.add.ellipse(0, 0, f.h * 0.9, f.h * 0.28, color, 0.55).setStrokeStyle(3, color, 1);
    f.c.addAt(aura, 0);
    f.aura = aura;
    if (animate) {
      const ring = this.add.ellipse(f.c.x, f.c.y - f.h * 0.5, f.h * 0.5, f.h * 0.5).setStrokeStyle(4, color, 1).setDepth(f.c.depth + 1);
      this.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      this.hop(f.body);
    }
  }

  private resetFighters() {
    for (const f of this.fighters.values()) {
      f.badge?.destroy();
      f.badge = null;
      f.aura?.destroy();
      f.aura = null;
      f.body.clearTint();
      f.body.setAngle(0);
      f.c.alpha = 1;
    }
  }

  private floatText(x: number, y: number, text: string, color: string, size: number) {
    const t = this.add
      .text(x, y, text, { fontFamily: this.font, fontSize: `${size}px`, color, stroke: '#23243a', strokeThickness: Math.max(4, size / 6), fontStyle: 'bold', padding: { top: 6, bottom: 4 } })
      .setOrigin(0.5)
      .setDepth(10000)
      .setResolution(Math.min(2, window.devicePixelRatio || 1))
      .setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: 500, duration: 800, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  }

  private burst(x: number, y: number, color: number, count: number) {
    const e = this.add.particles(x, y, 'dot', {
      speed: { min: 120, max: 320 },
      scale: { start: 0.7, end: 0 },
      lifespan: 520,
      tint: [color, 0xffffff],
      blendMode: 'ADD',
      emitting: false
    });
    e.setDepth(9999);
    e.explode(count);
    this.time.delayedCall(700, () => e.destroy());
  }

  private bossCenter() {
    return { x: this.bossC.x, y: this.bossC.y - this.bossH * 0.55 };
  }

  private flashBoss() {
    let n = 0;
    this.time.addEvent({
      delay: 60,
      repeat: 5,
      callback: () => {
        if (n++ % 2 === 0) this.bossBody.setTintFill(0xffffff);
        else this.bossBody.clearTint();
      }
    });
    if (this.bridge.reduced) return;
    const x = this.bossC.x;
    this.tweens.add({ targets: this.bossC, x: x + 10, duration: 45, yoyo: true, repeat: 3, onComplete: () => (this.bossC.x = x) });
  }

  // ---------------------------------------------------------------- boss skill (question start)

  private castBossSkill(r: RoomView) {
    const skill = r.bossSkill;
    if (!skill) return;
    const color = SKILL_COLOR[skill.type];
    const { x, y } = this.bossCenter();
    this.tweens.add({ targets: this.bossBody, y: -this.bossH * 0.12, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
    for (let i = 0; i < 2; i++) {
      const ring = this.add.ellipse(x, y, this.bossH * 0.6, this.bossH * 0.6).setStrokeStyle(6, color, 1).setDepth(9000);
      this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, delay: i * 180, duration: 700, onComplete: () => ring.destroy() });
    }
    this.burst(x, y, color, 24);
    const label = skill.type === 'HEAL' ? 'บอสเตรียมฟื้นเลือด!' : skill.type === 'SHORTEN' ? 'บอสเร่งเวลา!' : 'บอสสาปผู้นำ!';
    this.floatText(x, y - this.bossH * 0.55, label, '#ffffff', 20);

    if (skill.type === 'NERF_TOP' && skill.targetId) {
      const target = this.fighters.get(skill.targetId);
      if (!target) return;
      const tx = target.c.x;
      const ty = target.c.y - target.h * 0.6;
      const bolt = this.add.graphics().setDepth(9500);
      bolt.lineStyle(6, color, 1).beginPath().moveTo(x, y);
      const steps = 6;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        bolt.lineTo(x + (tx - x) * t + (i % 2 ? 14 : -14), y + (ty - y) * t);
      }
      bolt.lineTo(tx, ty).strokePath();
      bolt.alpha = 0;
      this.tweens.add({ targets: bolt, alpha: 1, duration: 80, delay: 250, yoyo: true, hold: 220, onComplete: () => bolt.destroy() });
      this.time.delayedCall(330, () => {
        target.body.setTint(color);
        this.burst(tx, ty, color, 16);
      });
    }
  }

  // ---------------------------------------------------------------- reveal: everyone who got it right attacks

  private showResults(results: ResultView[]) {
    results.forEach((res) => {
      const f = this.fighters.get(res.playerId);
      if (!f) return;
      if (res.correct) this.setBadge(f, 'ok');
      else this.slump(f);
    });
  }

  private slump(f: Fighter) {
    this.setBadge(f, 'no');
    f.body.setTint(0x9a9aa8);
    this.tweens.add({ targets: f.body, angle: -8, duration: 300, ease: 'Quad.easeOut' });
  }

  private playReveal(r: RoomView) {
    const reveal = r.reveal;
    if (!reveal) return;
    const hits = reveal.results.filter((x) => x.correct).sort((a, b) => a.elapsedMs - b.elapsedMs);
    reveal.results.filter((x) => !x.correct).forEach((res) => {
      const f = this.fighters.get(res.playerId);
      if (f) this.slump(f);
    });
    const gap = Math.max(90, Math.min(260, 1800 / Math.max(1, hits.length)));
    hits.forEach((res, i) => this.time.delayedCall(i * gap, () => this.attack(res)));
    if (reveal.healed > 0) {
      this.time.delayedCall(hits.length * gap + 700, () => {
        const { x, y } = this.bossCenter();
        this.bossBody.setTint(COLOR.good);
        this.time.delayedCall(400, () => this.bossBody.clearTint());
        const e = this.add.particles(x, y + this.bossH * 0.4, 'dot', { speedY: { min: -180, max: -80 }, speedX: { min: -40, max: 40 }, scale: { start: 0.6, end: 0 }, lifespan: 900, tint: COLOR.good, emitting: false });
        e.setDepth(9999).explode(30);
        this.time.delayedCall(1100, () => e.destroy());
        this.floatText(x, y - this.bossH * 0.3, `+${reveal.healed.toLocaleString('th-TH')}`, '#7dffb0', 30);
      });
    }
  }

  private attack(res: ResultView) {
    const f = this.fighters.get(res.playerId);
    const target = this.bossCenter();
    const color = res.doubled ? COLOR.double : res.nerfed ? COLOR.nerf : COLOR.hit;
    const startX = f ? f.c.x : this.scale.width * 0.2;
    const startY = f ? f.c.y - f.h * 0.6 : this.scale.height * 0.7;
    if (f) {
      this.setBadge(f, 'ok');
      this.tweens.add({ targets: f.body, x: 14, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    }
    const size = res.doubled ? 1.6 : res.nerfed ? 0.8 : 1.1;
    const orb = this.add.image(startX, startY, 'dot').setTint(color).setScale(size).setDepth(9800).setBlendMode(Phaser.BlendModes.ADD);
    const trail = this.add.particles(0, 0, 'dot', { speed: 10, scale: { start: 0.5 * size, end: 0 }, alpha: { start: 0.8, end: 0 }, lifespan: 260, frequency: 18, tint: color, blendMode: 'ADD' });
    trail.setDepth(9790).startFollow(orb);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2((startX + target.x) / 2, Math.min(startY, target.y) - this.scale.height * 0.18),
      new Phaser.Math.Vector2(target.x, target.y)
    );
    const p = new Phaser.Math.Vector2();
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 420,
      ease: 'Quad.easeIn',
      onUpdate: (tw) => {
        curve.getPoint(tw.getValue() ?? 0, p);
        orb.setPosition(p.x, p.y);
      },
      onComplete: () => {
        orb.destroy();
        trail.stopFollow();
        trail.stop();
        this.time.delayedCall(300, () => trail.destroy());
        this.burst(target.x, target.y, color, res.doubled ? 26 : 14);
        this.flashBoss();
        if (!this.bridge.reduced) this.cameras.main.shake(110, res.doubled ? 0.008 : 0.004);
        const jitter = (Math.random() - 0.5) * this.bossH * 0.5;
        this.floatText(target.x + jitter, target.y - this.bossH * 0.2, `−${res.damage}${res.doubled ? ' +50%' : ''}`, res.doubled ? '#ffb000' : '#ffe066', res.doubled ? 34 : 26);
      }
    });
  }

  // ---------------------------------------------------------------- end of the game

  private hideBoss() {
    this.bossDown = true;
    this.bossBody.setAlpha(0);
  }

  private reviveBoss() {
    this.bossDown = false;
    this.bossBody.setAlpha(1).setAngle(0).setY(0).clearTint();
  }

  private playEnd(victory: boolean) {
    const { x, y } = this.bossCenter();
    const fighters = [...this.fighters.values()];
    fighters.forEach((f) => {
      f.badge?.destroy();
      f.badge = null;
      f.body.clearTint();
      f.body.setAngle(0);
    });
    if (victory) {
      this.bossDown = true;
      this.flashBoss();
      this.tweens.add({ targets: this.bossBody, angle: 80, y: this.bossH * 0.15, alpha: 0, duration: 1300, delay: 300, ease: 'Quad.easeIn' });
      this.burst(x, y, COLOR.gold, 40);
      const W = this.scale.width;
      const confetti = this.add.particles(0, -10, 'dot', {
        x: { min: 0, max: W },
        speedY: { min: 120, max: 260 },
        speedX: { min: -60, max: 60 },
        scale: { min: 0.3, max: 0.6 },
        lifespan: 2600,
        quantity: 3,
        frequency: 40,
        tint: [0xff5d73, 0xffd23f, 0x4cc9f0, 0x2fbf71, 0x9b5de5]
      });
      confetti.setDepth(9999);
      this.time.delayedCall(2600, () => confetti.stop());
      this.time.delayedCall(5400, () => confetti.destroy());
      fighters.forEach((f, i) => this.tweens.add({ targets: f.body, y: '-=22', duration: 220, yoyo: true, repeat: 5, delay: (i % 6) * 70, ease: 'Quad.easeOut' }));
    } else {
      this.tweens.add({ targets: this.bossBody, scaleY: '*=1.08', scaleX: '*=0.95', duration: 140, yoyo: true, repeat: 5 });
      this.floatText(x, y - this.bossH * 0.55, 'ฮ่า ฮ่า ฮ่า!', '#ffffff', 26);
      fighters.forEach((f) => {
        f.body.setTint(0x9a9aa8);
        this.tweens.add({ targets: f.body, angle: -10, duration: 400, ease: 'Quad.easeOut' });
      });
    }
  }
}

export function createGame(parent: HTMLElement, bridge: Bridge): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#8fd3ff',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 800, height: parent.clientHeight || 450 },
    scene: new BattleField(bridge)
  });
}
