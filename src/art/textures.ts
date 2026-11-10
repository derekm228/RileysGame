import Phaser from 'phaser';

// All game art is drawn here with the canvas API, so the game needs no image
// files yet. To use hand-drawn art later, put PNGs in public/assets and load
// them in BootScene with the same texture keys/frame names.

type Ctx = CanvasRenderingContext2D;
type FrameDef = { name: string; draw: (ctx: Ctx) => void };

export const HERO_W = 48;
export const HERO_H = 64;
export const VILLAIN_W = 48;
export const VILLAIN_H = 72;

// ---------- helpers ----------

function sheet(scene: Phaser.Scene, key: string, w: number, h: number, frames: FrameDef[]) {
  const tex = scene.textures.createCanvas(key, w * frames.length, h)!;
  const ctx = tex.getContext();
  frames.forEach((f, i) => {
    ctx.save();
    ctx.translate(i * w, 0);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    f.draw(ctx);
    ctx.restore();
    tex.add(f.name, 0, i * w, 0, w, h);
  });
  tex.refresh();
}

function single(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void) {
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

function circle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, rot = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** Two-segment limb. Angles are radians from straight down; positive = forward (right). */
function limb(ctx: Ctx, x: number, y: number, a1: number, l1: number, a2: number, l2: number, width: number, color: string): [number, number] {
  const kx = x + Math.sin(a1) * l1;
  const ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a2) * l2;
  const ey = ky + Math.cos(a2) * l2;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(kx, ky);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  return [ex, ey];
}

interface Pose {
  tF: number; sF: number; // front thigh / shin
  tB: number; sB: number; // back thigh / shin
  aF: number; aB: number; // front / back arm
  bob: number;
}

const legExtent = (p: Pose, len: number) =>
  Math.max(Math.cos(p.tF) * len + Math.cos(p.sF) * len, Math.cos(p.tB) * len + Math.cos(p.sB) * len);

function runPoses(): Pose[] {
  const out: Pose[] = [];
  for (let i = 0; i < 6; i++) {
    const p = (i / 6) * Math.PI * 2;
    const s = Math.sin(p);
    const tF = s * 0.75;
    const tB = -s * 0.75;
    out.push({
      tF,
      sF: tF - 0.2 - 0.7 * Math.max(0, -Math.cos(p)),
      tB,
      sB: tB - 0.2 - 0.7 * Math.max(0, Math.cos(p)),
      aF: -s * 0.9,
      aB: s * 0.9,
      bob: -Math.abs(Math.cos(p)) * 1.5,
    });
  }
  return out;
}

// ---------- heroine ----------

const H = {
  red: '#e0242b', dark: '#a3121c', spot: '#151515', skin: '#f6cba5',
  hair: '#1d2347', boot: '#151515', eye: '#3a86ff',
};

function heroHead(ctx: Ctx, hx: number, hy: number) {
  // pigtails + ribbons
  circle(ctx, hx - 10, hy - 6, 5.5, H.hair);
  circle(ctx, hx + 6, hy - 11, 4.5, H.hair);
  ellipse(ctx, hx - 6.5, hy - 8, 2.6, 1.6, H.red, -0.5);
  ellipse(ctx, hx + 3.5, hy - 10, 2.4, 1.5, H.red, 0.5);
  // face
  circle(ctx, hx, hy, 10, H.skin);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // hair cap + back hair
  ctx.fillStyle = H.hair;
  ctx.beginPath();
  ctx.arc(hx, hy, 10.6, Math.PI * 0.92, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.arc(hx, hy, 10.6, Math.PI * 0.55, Math.PI * 1.0);
  ctx.closePath();
  ctx.fill();
  // bangs
  ctx.beginPath();
  ctx.moveTo(hx + 1, hy - 9);
  ctx.lineTo(hx + 10, hy - 5);
  ctx.lineTo(hx + 5, hy - 2);
  ctx.closePath();
  ctx.fill();
  // spotted mask
  ellipse(ctx, hx + 4.5, hy + 1, 6, 3.4, H.red);
  circle(ctx, hx + 1.2, hy + 0.3, 0.9, H.spot);
  circle(ctx, hx + 8.8, hy + 1.8, 0.8, H.spot);
  // eye
  ellipse(ctx, hx + 5, hy + 1, 2.2, 2.6, '#fff');
  circle(ctx, hx + 5.7, hy + 1.2, 1.4, H.eye);
  circle(ctx, hx + 6.1, hy + 0.5, 0.5, '#fff');
  // cheek + smile
  circle(ctx, hx + 2, hy + 5.8, 1.6, 'rgba(240,120,120,0.6)');
  ctx.strokeStyle = '#7a2b2b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(hx + 6, hy + 4.6, 2.2, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

function drawHero(ctx: Ctx, p: Pose) {
  const cx = 24;
  const hipY = 61 - legExtent(p, 10);
  const up = hipY - 41 + p.bob; // upper-body offset
  const shY = 28 + up;

  const arm = (x: number, a: number, color: string) => {
    const [ex, ey] = limb(ctx, x, shY, a, 7, a + 0.5, 7, 4.5, color);
    circle(ctx, ex, ey, 2.4, H.skin);
  };
  const leg = (x: number, t: number, s: number, color: string) => {
    const [ex, ey] = limb(ctx, x, hipY, t, 10, s, 10, 6, color);
    ellipse(ctx, ex + 2, ey - 0.5, 4.5, 2.6, H.boot);
  };

  arm(cx - 1, p.aB, H.dark);
  leg(cx - 1, p.tB, p.sB, H.dark);
  // torso
  ctx.fillStyle = H.red;
  ctx.beginPath();
  ctx.roundRect(cx - 7, 25 + up, 14, 19, 5);
  ctx.fill();
  circle(ctx, cx - 3, 30 + up, 1.8, H.spot);
  circle(ctx, cx + 3, 34 + up, 1.8, H.spot);
  circle(ctx, cx - 2, 39 + up, 1.6, H.spot);
  circle(ctx, cx + 4, 41 + up, 1.3, H.spot);
  leg(cx + 1, p.tF, p.sF, H.red);
  arm(cx + 1, p.aF, H.red);
  heroHead(ctx, cx + 1, 16 + up);
}

// ---------- villain ----------

const V = {
  coat: '#5a189a', coatDark: '#3c096c', hat: '#240046', band: '#9d4edd',
  skin: '#b9c6a3', nose: '#a3b18a', leg: '#3d3d4a', legDark: '#2a2a36', boot: '#111', glove: '#222',
};

type Face = 'sneaky' | 'scared' | 'dizzy';

function villainHead(ctx: Ctx, hx: number, hy: number, face: Face, hatTilt = 0) {
  circle(ctx, hx, hy, 8.5, V.skin);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  circle(ctx, hx + 8, hy + 2, 3.2, V.nose);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  if (face === 'sneaky') {
    ellipse(ctx, hx + 4, hy - 1, 2.3, 1.4, '#ffd60a');
    circle(ctx, hx + 4.8, hy - 1, 0.8, '#111');
    ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 4.5); ctx.lineTo(hx + 7, hy - 2.5); ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(hx + 4, hy + 4, 3, 0.15 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  } else if (face === 'scared') {
    circle(ctx, hx + 4, hy - 1, 2.7, '#fff');
    circle(ctx, hx + 4.5, hy - 1, 1, '#111');
    ctx.beginPath(); ctx.moveTo(hx + 1, hy - 6); ctx.lineTo(hx + 7, hy - 6.5); ctx.stroke();
    circle(ctx, hx + 4, hy + 5.2, 2, '#3a0d0d');
  } else {
    ctx.beginPath();
    ctx.moveTo(hx + 2, hy - 3); ctx.lineTo(hx + 6, hy + 1);
    ctx.moveTo(hx + 6, hy - 3); ctx.lineTo(hx + 2, hy + 1);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(hx + 4, hy + 7.5, 2.5, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
  }
  // mustache
  ellipse(ctx, hx + 5, hy + 4.2, 4.2, 1.5, '#2b2b2b', -0.1);
  // hat
  ctx.save();
  ctx.translate(hx + 1, hy - 7);
  ctx.rotate(hatTilt);
  ellipse(ctx, 0, 0, 13, 3, V.hat);
  ctx.fillStyle = V.hat;
  ctx.fillRect(-7.5, -11, 15, 11);
  ctx.fillStyle = V.band;
  ctx.fillRect(-7.5, -3.5, 15, 2.5);
  ctx.restore();
}

function drawVillain(ctx: Ctx, p: Pose, face: Face, hatTilt = 0) {
  const cx = 24;
  const hipY = 70 - legExtent(p, 10);
  const up = hipY - 51 + p.bob;
  const shY = 30 + up;

  const arm = (x: number, a: number, color: string) => {
    const [ex, ey] = limb(ctx, x, shY, a, 9, a + 0.5, 8, 6, color);
    circle(ctx, ex, ey, 3, V.glove);
  };
  const leg = (x: number, t: number, s: number, color: string) => {
    const [ex, ey] = limb(ctx, x, hipY, t, 10, s, 10, 6, color);
    ellipse(ctx, ex + 3, ey - 1, 6.5, 3.2, V.boot);
  };

  arm(cx - 1, p.aB, V.coatDark);
  leg(cx - 2, p.tB, p.sB, V.legDark);
  leg(cx + 2, p.tF, p.sF, V.leg);
  // trench coat
  ctx.fillStyle = V.coat;
  ctx.beginPath();
  ctx.moveTo(cx - 8, 27 + up);
  ctx.lineTo(cx + 8, 27 + up);
  ctx.lineTo(cx + 12, 54 + up);
  ctx.lineTo(cx - 12, 54 + up);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = V.coatDark;
  ctx.beginPath();
  ctx.moveTo(cx - 6, 27 + up);
  ctx.lineTo(cx + 8, 27 + up);
  ctx.lineTo(cx + 1, 36 + up);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - 12, 46 + up, 24, 2);
  circle(ctx, cx + 4, 39 + up, 1.3, '#ffd60a');
  circle(ctx, cx + 5, 51 + up, 1.3, '#ffd60a');
  arm(cx + 1, p.aF, V.coat);
  villainHead(ctx, cx + 1, 20 + up, face, hatTilt);
}

// ---------- scenery ----------

function bricks(ctx: Ctx, x0: number, y0: number, w: number, h: number, base: string, mortar: string, rowH = 10, bw = 32) {
  ctx.fillStyle = base;
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = mortar;
  let row = 0;
  for (let y = y0; y < y0 + h; y += rowH, row++) {
    ctx.fillRect(x0, y + rowH - 2, w, 2);
    for (let x = x0 + (row % 2 ? bw / 2 : 0); x < x0 + w; x += bw) ctx.fillRect(x, y, 2, rowH);
  }
}

function skyline(ctx: Ctx, W: number, Hh: number, rng: Phaser.Math.RandomDataGenerator, color: string, win: string, lit: string, minH: number, maxH: number) {
  let x = 0;
  while (x < W) {
    let w = rng.between(46, 100);
    if (W - (x + w) < 46) w = W - x;
    const h = rng.between(minH, maxH);
    const top = Hh - h;
    ctx.fillStyle = color;
    ctx.fillRect(x, top, w, h);
    const roof = rng.between(0, 2);
    if (roof === 0) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + w / 2, top - 18);
      ctx.lineTo(x + w, top);
      ctx.closePath();
      ctx.fill();
    } else if (roof === 1) {
      ctx.fillRect(x + w * 0.2, top - 12, 8, 12);
    }
    for (let wy = top + 12; wy < Hh - 14; wy += 18) {
      for (let wx = x + 8; wx < x + w - 12; wx += 14) {
        ctx.fillStyle = rng.frac() < 0.22 ? lit : win;
        ctx.fillRect(wx, wy, 6, 9);
      }
    }
    x += w;
  }
}

// ---------- public ----------

export function generateTextures(scene: Phaser.Scene) {
  const runs = runPoses();
  const idle = (bob: number): Pose => ({ tF: 0.08, sF: 0.08, tB: -0.08, sB: -0.08, aF: 0.15, aB: -0.15, bob });

  sheet(scene, 'hero', HERO_W, HERO_H, [
    { name: 'idle0', draw: (c) => drawHero(c, idle(0)) },
    { name: 'idle1', draw: (c) => drawHero(c, idle(1)) },
    ...runs.map((p, i) => ({ name: `run${i}`, draw: (c: Ctx) => drawHero(c, p) })),
    { name: 'jump', draw: (c) => drawHero(c, { tF: 1.1, sF: 0.2, tB: -0.4, sB: -0.9, aF: 2.7, aB: -2.3, bob: 0 }) },
    { name: 'fall', draw: (c) => drawHero(c, { tF: 0.35, sF: 0.15, tB: -0.3, sB: -0.5, aF: 1.9, aB: -1.7, bob: 0 }) },
  ]);

  const sneak = (bob: number): Pose => ({ tF: 0.25, sF: 0.05, tB: -0.2, sB: -0.3, aF: 0.9, aB: 0.6, bob });
  sheet(scene, 'villain', VILLAIN_W, VILLAIN_H, [
    { name: 'idle0', draw: (c) => drawVillain(c, sneak(0), 'sneaky') },
    { name: 'idle1', draw: (c) => drawVillain(c, sneak(1), 'sneaky') },
    ...runs.map((p, i) => ({ name: `run${i}`, draw: (c: Ctx) => drawVillain(c, p, 'sneaky') })),
    { name: 'jump', draw: (c) => drawVillain(c, { tF: 0.9, sF: 0.1, tB: -0.5, sB: -0.9, aF: 2.4, aB: -2.0, bob: 0 }, 'sneaky') },
    { name: 'scared', draw: (c) => drawVillain(c, { tF: 0.3, sF: 0.3, tB: -0.3, sB: -0.3, aF: 2.8, aB: -2.8, bob: 0 }, 'scared') },
    { name: 'caught', draw: (c) => drawVillain(c, { tF: 0.4, sF: 0.4, tB: -0.4, sB: -0.4, aF: 0.4, aB: -0.4, bob: 2 }, 'dizzy', -0.35) },
  ]);

  // boot print left by the bad guy (toe points right)
  single(scene, 'print', 24, 14, (c) => {
    ellipse(c, 15, 7, 7.5, 5.5, '#3a2a1f');
    ellipse(c, 4.5, 7, 3.8, 4.4, '#3a2a1f');
    c.fillStyle = '#5a4535';
    for (let x = 11; x <= 19; x += 4) c.fillRect(x, 4, 1.5, 6);
  });

  single(scene, 'sparkle', 12, 12, (c) => {
    c.fillStyle = '#fff3a0';
    c.beginPath();
    c.moveTo(6, 0); c.lineTo(7.5, 4.5); c.lineTo(12, 6); c.lineTo(7.5, 7.5);
    c.lineTo(6, 12); c.lineTo(4.5, 7.5); c.lineTo(0, 6); c.lineTo(4.5, 4.5);
    c.closePath();
    c.fill();
  });

  single(scene, 'confetti', 6, 10, (c) => {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, 6, 10);
  });

  // ladybug emblem for the title screen
  single(scene, 'emblem', 72, 72, (c) => {
    circle(c, 36, 36, 32, '#111');
    circle(c, 36, 36, 29, H.red);
    c.fillStyle = '#111';
    c.fillRect(34.5, 7, 3, 58);
    [[22, 24, 6], [50, 24, 6], [18, 44, 5], [54, 44, 5], [28, 56, 4], [44, 56, 4]].forEach(([x, y, r]) => circle(c, x, y, r, '#111'));
    ellipse(c, 24, 18, 7, 4, 'rgba(255,255,255,0.35)', -0.6);
  });

  // ground: stone curb on top of brick
  single(scene, 'ground', 64, 60, (c) => {
    bricks(c, 0, 10, 64, 50, '#9a5034', '#6b3420');
    c.fillStyle = '#a6a6b0'; c.fillRect(0, 0, 64, 10);
    c.fillStyle = '#d4d4de'; c.fillRect(0, 0, 64, 2);
    c.fillStyle = '#6e6e78'; c.fillRect(0, 9, 64, 2);
    c.fillRect(21, 2, 2, 7); c.fillRect(43, 2, 2, 7);
  });

  single(scene, 'wall', 64, 60, (c) => bricks(c, 0, 0, 64, 60, '#7d3f29', '#552916'));

  // rooftop platform
  single(scene, 'platform', 64, 24, (c) => {
    c.fillStyle = '#4f5370'; c.fillRect(0, 0, 64, 24);
    c.fillStyle = '#8a8fb5'; c.fillRect(0, 0, 64, 6);
    c.fillStyle = '#b5b9d8'; c.fillRect(0, 0, 64, 2);
    c.fillStyle = '#3d4058';
    for (let x = 8; x < 64; x += 16) c.fillRect(x, 8, 2, 13);
    c.fillStyle = '#2f3246'; c.fillRect(0, 21, 64, 3);
  });

  single(scene, 'crate', 48, 48, (c) => {
    c.fillStyle = '#b07a3c'; c.fillRect(0, 0, 48, 48);
    c.strokeStyle = '#8a5a2b'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(6, 6); c.lineTo(42, 42); c.moveTo(42, 6); c.lineTo(6, 42); c.stroke();
    c.strokeStyle = '#6e4519'; c.lineWidth = 4; c.strokeRect(2, 2, 44, 44);
  });

  // background layers
  single(scene, 'sky', 960, 540, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, '#4cb4ef');
    g.addColorStop(0.55, '#a3dbf5');
    g.addColorStop(1, '#ffd1e3');
    c.fillStyle = g;
    c.fillRect(0, 0, 960, 540);
    circle(c, 790, 110, 70, 'rgba(255,243,176,0.35)');
    circle(c, 790, 110, 46, '#fff3b0');
  });

  const rng = new Phaser.Math.RandomDataGenerator(['riley']);
  single(scene, 'clouds', 960, 200, (c) => {
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 150 + rng.between(-30, 30);
      const y = rng.between(40, 150);
      for (let j = 0; j < 4; j++) {
        circle(c, x + j * 22 - 33, y - (j % 3 === 1 ? 12 : 0), rng.between(16, 24), 'rgba(255,255,255,0.85)');
      }
    }
  });
  single(scene, 'skyline-far', 960, 300, (c) => skyline(c, 960, 300, rng, '#b7c3e6', '#cdd6f0', '#fff5cc', 120, 240));
  single(scene, 'skyline-near', 960, 220, (c) => skyline(c, 960, 220, rng, '#7d8fc4', '#6a7cb0', '#ffe8a3', 70, 170));
}

export function createAnimations(scene: Phaser.Scene) {
  const frames = (key: string, names: string[]) => names.map((frame) => ({ key, frame }));
  const runNames = [0, 1, 2, 3, 4, 5].map((i) => `run${i}`);
  scene.anims.create({ key: 'hero-idle', frames: frames('hero', ['idle0', 'idle1']), frameRate: 2, repeat: -1 });
  scene.anims.create({ key: 'hero-run', frames: frames('hero', runNames), frameRate: 14, repeat: -1 });
  scene.anims.create({ key: 'villain-idle', frames: frames('villain', ['idle0', 'idle1']), frameRate: 3, repeat: -1 });
  scene.anims.create({ key: 'villain-run', frames: frames('villain', runNames), frameRate: 14, repeat: -1 });
}
