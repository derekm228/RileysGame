import Phaser from 'phaser';
import { createBackground } from '../background';
import { FONT, VIEW_W } from '../config';
import { GROUND_Y, GROUND_H } from '../level';
import { sfx } from '../audio';

export class TitleScene extends Phaser.Scene {
  private updateBg!: (x: number) => void;
  private street!: Phaser.GameObjects.TileSprite;
  private scroll = 0;

  constructor() {
    super('TitleScene');
  }

  create() {
    this.scroll = 0;
    this.updateBg = createBackground(this);
    this.street = this.add.tileSprite(0, GROUND_Y, VIEW_W, GROUND_H, 'ground').setOrigin(0);

    // the chase, running in place
    const hero = this.add.sprite(300, GROUND_Y - 32, 'hero').play('hero-run');
    const villain = this.add.sprite(640, GROUND_Y - 36, 'villain').play('villain-run');
    this.tweens.add({ targets: villain, x: 680, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: hero, x: 340, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const cx = VIEW_W / 2;
    this.add.image(cx, 80, 'emblem');
    this.add.text(cx, 150, 'MIRACULOUS', { fontFamily: FONT, fontSize: '40px', color: '#ffffff', stroke: '#111', strokeThickness: 8 }).setOrigin(0.5);
    const title = this.add.text(cx, 218, 'LADYBUG', { fontFamily: FONT, fontSize: '84px', color: '#e0242b', stroke: '#111', strokeThickness: 10 }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, 290, 'Follow the tracks. Catch the thief!', { fontFamily: FONT, fontSize: '22px', color: '#3c096c', stroke: '#fff', strokeThickness: 5 }).setOrigin(0.5);

    const prompt = this.add.text(cx, 345, 'Press SPACE or tap to start', { fontFamily: FONT, fontSize: '24px', color: '#ffd60a', stroke: '#111', strokeThickness: 6 }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(cx, 515, '←  →  move      ↑ / SPACE  jump (hold to jump higher)', { fontFamily: FONT, fontSize: '16px', color: '#fff' }).setOrigin(0.5);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      sfx.start();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
    };
    this.input.keyboard!.on('keydown-SPACE', start);
    this.input.keyboard!.on('keydown-ENTER', start);
    this.input.on('pointerdown', start);
  }

  update(_t: number, delta: number) {
    this.scroll += delta * 0.25;
    this.updateBg(this.scroll);
    this.street.tilePositionX = this.scroll;
  }
}
