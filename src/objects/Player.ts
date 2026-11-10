import Phaser from 'phaser';
import { sfx } from '../audio';
import type { TouchControls } from './TouchControls';

export interface Controls {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  touch?: TouchControls;
}

const SPEED = 260;
const JUMP_V = -640;
const COYOTE_MS = 100; // can still jump just after running off a ledge
const BUFFER_MS = 120; // a jump pressed just before landing still counts

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  private coyote = 0;
  private buffer = 0;
  private rising = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 'idle0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(20, 48).setOffset(14, 16);
    this.setCollideWorldBounds(true);
    this.setDepth(10);
  }

  tick(c: Controls, delta: number) {
    const t = c.touch;
    const left = c.left.some((k) => k.isDown) || !!t?.left;
    const right = c.right.some((k) => k.isDown) || !!t?.right;
    const jumpHeld = c.jump.some((k) => k.isDown) || !!t?.jump;
    // check every key so JustDown state is consumed for all of them
    const keyJump = c.jump.map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
    const jumpPressed = keyJump || !!t?.jumpPressed;
    const onGround = this.body.blocked.down || this.body.touching.down;

    this.coyote = onGround ? COYOTE_MS : Math.max(0, this.coyote - delta);
    this.buffer = jumpPressed ? BUFFER_MS : Math.max(0, this.buffer - delta);

    if (left === right) this.setVelocityX(0);
    else {
      this.setVelocityX(left ? -SPEED : SPEED);
      this.setFlipX(left);
    }

    if (this.buffer > 0 && this.coyote > 0) {
      this.setVelocityY(JUMP_V);
      this.buffer = 0;
      this.coyote = 0;
      this.rising = true;
      sfx.jump();
    }
    // let go of jump early = smaller hop
    if (this.rising && !jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * 0.45);
      this.rising = false;
    }
    if (this.body.velocity.y >= 0) this.rising = false;

    if (!onGround) {
      this.anims.stop();
      this.setFrame(this.body.velocity.y < 0 ? 'jump' : 'fall');
    } else if (this.body.velocity.x !== 0) {
      this.anims.play('hero-run', true);
    } else {
      this.anims.play('hero-idle', true);
    }
  }
}
