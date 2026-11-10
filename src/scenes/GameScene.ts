import Phaser from 'phaser';
import { Player, type Controls } from '../objects/Player';
import { Villain } from '../objects/Villain';
import { TouchControls } from '../objects/TouchControls';
import { createBackground } from '../background';
import { FONT, VIEW_W, VIEW_H } from '../config';
import * as L from '../level';
import { sfx } from '../audio';

type StaticImage = Phaser.Physics.Arcade.Image & { body: Phaser.Physics.Arcade.StaticBody };

const HUD_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT, fontSize: '22px', color: '#fff', stroke: '#000', strokeThickness: 5,
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private villain!: Villain;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private prints!: Phaser.Physics.Arcade.StaticGroup;
  private controls!: Controls;
  private sparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hudTracks!: Phaser.GameObjects.Text;
  private hudTime!: Phaser.GameObjects.Text;
  private updateBg!: (x: number) => void;
  private speech?: Phaser.GameObjects.Text;
  private tracksFound = 0;
  private printCount = 0;
  private startTime = 0;
  private caught = false;
  private checkpoint = { x: 0, y: 0 };

  constructor() {
    super('GameScene');
  }

  create() {
    this.tracksFound = 0;
    this.printCount = 0;
    this.caught = false;
    this.speech = undefined;
    this.startTime = this.game.loop.time;
    this.checkpoint = { ...L.PLAYER_START };

    // open bottom so she can fall into pits
    this.physics.world.setBounds(0, 0, L.WORLD_W, VIEW_H + 300);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.updateBg = createBackground(this);
    this.buildLevel();

    this.player = new Player(this, L.PLAYER_START.x, L.PLAYER_START.y);
    const chaseCrates = L.crates.filter((c) => c.x > L.CHASE_START).map((c) => c.x);
    this.villain = new Villain(
      this, L.VILLAIN_START, L.GROUND_Y - 40, L.VILLAIN_END, chaseCrates,
      (x, y) => this.addPrint(x, y),
      () => this.onVillainAlert(),
    );

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.villain, this.solids);
    this.physics.add.overlap(this.player, this.prints, (_p, print) => this.collect(print as unknown as StaticImage));
    this.physics.add.overlap(this.player, this.villain, () => this.catchVillain());

    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      speed: { min: 60, max: 170 },
      angle: { min: 200, max: 340 },
      gravityY: 300,
      lifespan: 450,
      scale: { start: 1, end: 0 },
      emitting: false,
    }).setDepth(20);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, L.WORLD_W, VIEW_H);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setFollowOffset(-120, 0);
    cam.fadeIn(300);

    this.add.image(30, 31, 'print').setScrollFactor(0).setDepth(50).setScale(1.4);
    this.hudTracks = this.add.text(52, 16, 'Tracks: 0', HUD_STYLE).setScrollFactor(0).setDepth(50);
    this.hudTime = this.add.text(VIEW_W - 16, 16, 'Time: 0.0', HUD_STYLE).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.controls = {
      left: [kb.addKey(K.LEFT), kb.addKey(K.A)],
      right: [kb.addKey(K.RIGHT), kb.addKey(K.D)],
      jump: [kb.addKey(K.UP), kb.addKey(K.SPACE), kb.addKey(K.W)],
      touch: TouchControls.isTouchDevice(this) ? new TouchControls(this) : undefined,
    };

    this.showMessage("Follow the bad guy's tracks!", 2600);
  }

  update(time: number, delta: number) {
    if (this.caught) return;
    this.controls.touch?.update();
    this.player.tick(this.controls, delta);
    this.villain.tick(this.player.x);
    this.updateBg(this.cameras.main.scrollX);

    if (this.player.y > VIEW_H + 80) this.respawn();
    this.hudTime.setText(`Time: ${((time - this.startTime) / 1000).toFixed(1)}`);
    this.speech?.setPosition(this.villain.x, this.villain.y - 50);
  }

  private buildLevel() {
    this.solids = this.physics.add.staticGroup();
    const solid = (x: number, y: number, w: number, h: number, key: string) => {
      this.solids.add(this.add.tileSprite(x + w / 2, y + h / 2, w, h, key));
    };
    L.ground.forEach(([a, b]) => solid(a, L.GROUND_Y, b - a, L.GROUND_H, 'ground'));
    L.platforms.forEach((p) => solid(p.x, p.y, p.w, p.h, 'platform'));
    L.crates.forEach((c) => solid(c.x, c.y, L.CRATE, L.CRATE, 'crate'));
    solid(L.WORLD_W - 40, 0, 40, L.GROUND_Y, 'wall'); // dead end

    this.prints = this.physics.add.staticGroup();
    L.tracks.forEach((t) => this.addPrint(t.x, t.y));
  }

  /** Place a footprint standing on the surface at surfaceY. */
  private addPrint(x: number, surfaceY: number) {
    const alt = this.printCount++ % 2 === 1; // left foot / right foot
    const img = this.prints.create(x, surfaceY - 5 - (alt ? 2 : 0), 'print') as StaticImage;
    img.setDepth(5).setFlipY(alt);
    img.body.setSize(34, 56); // generous pickup area
    this.tweens.add({ targets: img, alpha: { from: 0.6, to: 1 }, duration: 700, yoyo: true, repeat: -1, delay: x % 700 });
  }

  private collect(img: StaticImage) {
    if (!img.body.enable) return;
    this.physics.world.disable(img);
    this.tweens.killTweensOf(img);
    this.tracksFound++;
    this.hudTracks.setText(`Tracks: ${this.tracksFound}`);
    this.checkpoint = { x: img.x, y: img.y - 40 };
    sfx.collect();
    this.sparkles.explode(6, img.x, img.y);
    this.tweens.add({ targets: img, scale: 1.8, alpha: 0, duration: 300, onComplete: () => img.destroy() });
  }

  private respawn() {
    sfx.fall();
    this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
    this.player.setVelocity(0, 0);
    this.cameras.main.flash(250, 255, 255, 255);
    this.showMessage('Oops! Follow the tracks!', 1600);
  }

  private onVillainAlert() {
    sfx.alert();
    const v = this.villain;
    const bang = this.add.text(v.x, v.y - 60, '!', { fontFamily: FONT, fontSize: '44px', color: '#ffd60a', stroke: '#000', strokeThickness: 7 })
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: bang, y: bang.y - 14, duration: 180, yoyo: true, repeat: 1, onComplete: () => bang.destroy() });

    this.time.delayedCall(500, () => {
      this.speech = this.add.text(v.x, v.y - 50, "Ha! You'll never catch me!", {
        fontFamily: FONT, fontSize: '16px', color: '#fff', backgroundColor: '#3c096cdd', padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 1).setDepth(30);
      this.time.delayedCall(2200, () => {
        this.speech?.destroy();
        this.speech = undefined;
      });
    });
  }

  private catchVillain() {
    if (this.caught || this.villain.mode === 'waiting') return;
    this.caught = true;
    const time = (this.game.loop.time - this.startTime) / 1000;

    this.physics.pause();
    this.speech?.destroy();
    this.speech = undefined;
    this.villain.getCaught();
    this.player.anims.play('hero-idle');
    sfx.win();
    this.cameras.main.zoomTo(1.5, 700, 'Sine.easeInOut');

    const v = this.villain;
    const txt = this.add.text(v.x, v.y - 70, 'Gotcha!', { fontFamily: FONT, fontSize: '32px', color: '#ffd60a', stroke: '#000', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(30).setScale(0);
    this.tweens.add({ targets: txt, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.sparkles.explode(16, v.x, v.y - 20);

    this.time.delayedCall(2000, () => this.scene.start('WinScene', { tracks: this.tracksFound, time }));
  }

  private showMessage(text: string, ms: number) {
    const msg = this.add.text(VIEW_W / 2, 90, text, { fontFamily: FONT, fontSize: '28px', color: '#ffd60a', stroke: '#111', strokeThickness: 7 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(40);
    this.tweens.add({ targets: msg, alpha: 0, delay: ms, duration: 400, onComplete: () => msg.destroy() });
  }
}
