import Phaser from 'phaser';
import { FONT, VIEW_W, VIEW_H } from '../config';

type ButtonName = 'left' | 'right' | 'jump';

interface Button {
  name: ButtonName;
  hit: Phaser.Geom.Circle; // touch area (a bit bigger than the drawn button)
  view: Phaser.GameObjects.Arc;
}

/**
 * On-screen buttons for phones and tablets. Checks every finger each frame,
 * so sliding a thumb from ◀ to ▶ works, and you can run and jump at once.
 */
export class TouchControls {
  left = false;
  right = false;
  jump = false;
  jumpPressed = false; // true only on the frame the jump button goes down
  private buttons: Button[] = [];

  /** Only shows buttons on devices with a touch screen. */
  static isTouchDevice(scene: Phaser.Scene) {
    return scene.sys.game.device.input.touch;
  }

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(2); // allow 3 fingers at once
    const y = VIEW_H - 75;
    this.add('left', 85, y, '◀');
    this.add('right', 210, y, '▶');
    this.add('jump', VIEW_W - 95, y, '▲');
  }

  private add(name: ButtonName, x: number, y: number, label: string) {
    const view = this.scene.add.circle(x, y, 50, 0x000000, 0.3)
      .setStrokeStyle(3, 0xffffff, 0.7).setScrollFactor(0).setDepth(60);
    this.scene.add.text(x, y, label, { fontFamily: FONT, fontSize: '40px', color: '#fff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0.85);
    this.buttons.push({ name, hit: new Phaser.Geom.Circle(x, y, 64), view });
  }

  update() {
    const fingers = this.scene.input.manager.pointers.filter((p) => p.isDown);
    const wasJump = this.jump;
    for (const b of this.buttons) {
      const down = fingers.some((p) => b.hit.contains(p.x, p.y));
      this[b.name] = down;
      b.view.setFillStyle(down ? 0xe0242b : 0x000000, down ? 0.6 : 0.3);
    }
    this.jumpPressed = this.jump && !wasJump;
  }
}
