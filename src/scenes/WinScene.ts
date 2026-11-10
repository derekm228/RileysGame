import Phaser from 'phaser';
import { createBackground } from '../background';
import { FONT, VIEW_W } from '../config';
import { GROUND_Y, GROUND_H } from '../level';

interface Result { tracks: number; time: number }

export class WinScene extends Phaser.Scene {
  private result: Result = { tracks: 0, time: 0 };
  private stars: Phaser.GameObjects.Image[] = [];
  private villain!: Phaser.GameObjects.Sprite;

  constructor() {
    super('WinScene');
  }

  init(data: Result) {
    this.result = data;
  }

  create() {
    createBackground(this)(0);
    this.add.tileSprite(0, GROUND_Y, VIEW_W, GROUND_H, 'ground').setOrigin(0);
    const cx = VIEW_W / 2;

    const hero = this.add.sprite(cx - 70, GROUND_Y - 32, 'hero', 'jump').setScale(1.5).setOrigin(0.5, 0.5);
    hero.y = GROUND_Y - 48;
    this.tweens.add({ targets: hero, y: hero.y - 30, duration: 380, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });

    this.villain = this.add.sprite(cx + 80, GROUND_Y - 54, 'villain', 'caught').setScale(1.5).setFlipX(true);
    this.stars = [0, 1, 2].map(() => this.add.image(0, 0, 'sparkle').setScale(1.3));

    this.add.particles(0, -10, 'confetti', {
      x: { min: 0, max: VIEW_W },
      speedY: { min: 80, max: 180 },
      speedX: { min: -40, max: 40 },
      rotate: { min: 0, max: 360 },
      lifespan: 5000,
      frequency: 50,
      tint: [0xe0242b, 0x111111, 0xffd60a, 0x3a86ff, 0xffffff],
    });

    const title = this.add.text(cx, 90, 'GOTCHA!', { fontFamily: FONT, fontSize: '84px', color: '#ffd60a', stroke: '#111', strokeThickness: 10 }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 500, ease: 'Back.easeOut' });

    this.add.text(cx, 165, 'You caught the sneaky thief!', { fontFamily: FONT, fontSize: '28px', color: '#fff', stroke: '#111', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(cx, 225, `Tracks followed: ${this.result.tracks}     Time: ${this.result.time.toFixed(1)} s`, {
      fontFamily: FONT, fontSize: '22px', color: '#3c096c', stroke: '#fff', strokeThickness: 5,
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, 290, 'Press SPACE or tap to play again', { fontFamily: FONT, fontSize: '22px', color: '#ffd60a', stroke: '#111', strokeThickness: 6 }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    let done = false;
    const again = () => {
      if (done) return;
      done = true;
      this.scene.start('GameScene');
    };
    // short delay so the key press that won the game doesn't skip this screen
    this.time.delayedCall(600, () => {
      this.input.keyboard!.on('keydown-SPACE', again);
      this.input.on('pointerdown', again);
    });
  }

  update(time: number) {
    // dizzy stars circling the bad guy's head
    this.stars.forEach((s, i) => {
      const a = time / 300 + (i * Math.PI * 2) / 3;
      s.setPosition(this.villain.x + Math.cos(a) * 26, this.villain.y - 52 + Math.sin(a) * 8);
      s.setDepth(Math.sin(a) > 0 ? 2 : 0);
    });
  }
}
