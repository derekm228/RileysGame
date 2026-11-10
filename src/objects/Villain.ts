import Phaser from 'phaser';

export type VillainMode = 'waiting' | 'alerted' | 'fleeing' | 'cornered' | 'caught';

const FLEE_SPEED = 220; // a bit slower than the heroine, so she can catch up
const JUMP_V = -600;
const NOTICE_DIST = 380;
const PRINT_EVERY = 80;

export class Villain extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  mode: VillainMode = 'waiting';
  private lastPrintX = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private endX: number,
    private obstacles: number[],
    private onPrint: (x: number, y: number) => void,
    private onAlert: () => void,
  ) {
    super(scene, x, y, 'villain', 'idle0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(22, 56).setOffset(13, 16);
    this.setCollideWorldBounds(true);
    this.setDepth(9);
  }

  tick(playerX: number) {
    const onGround = this.body.blocked.down || this.body.touching.down;

    if (this.mode === 'waiting') {
      this.anims.play('villain-idle', true);
      if (playerX > this.x - NOTICE_DIST) {
        this.mode = 'alerted';
        this.anims.stop();
        this.setFrame('scared');
        this.setFlipX(true); // looks back at her
        this.onAlert();
        this.scene.time.delayedCall(650, () => {
          if (this.mode !== 'alerted') return;
          this.mode = 'fleeing';
          this.setFlipX(false);
          this.lastPrintX = this.x;
        });
      }
    } else if (this.mode === 'fleeing') {
      this.setVelocityX(FLEE_SPEED);
      if (onGround) {
        const crateAhead = this.obstacles.some((ox) => ox - this.x > 0 && ox - this.x < 85);
        if (crateAhead || this.body.blocked.right) this.setVelocityY(JUMP_V);
        this.anims.play('villain-run', true);
        if (this.x - this.lastPrintX > PRINT_EVERY) {
          this.lastPrintX = this.x;
          this.onPrint(this.x - 6, this.body.bottom);
        }
      } else {
        this.anims.stop();
        this.setFrame('jump');
      }
      if (this.x >= this.endX) {
        this.mode = 'cornered';
        this.setVelocityX(0);
        this.anims.stop();
        this.setFrame('scared');
        this.setFlipX(true);
      }
    }
  }

  getCaught() {
    this.mode = 'caught';
    this.anims.stop();
    this.setFrame('caught');
    this.setFlipX(true);
  }
}
