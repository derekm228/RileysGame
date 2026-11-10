import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from './config';

/** Adds parallax sky + city layers. Returns a function to call each frame with the scroll position. */
export function createBackground(scene: Phaser.Scene): (scrollX: number) => void {
  scene.add.image(0, 0, 'sky').setOrigin(0).setScrollFactor(0).setDepth(-10);
  const clouds = scene.add.tileSprite(0, 10, VIEW_W, 200, 'clouds').setOrigin(0).setScrollFactor(0).setDepth(-9);
  const far = scene.add.tileSprite(0, VIEW_H - 300, VIEW_W, 300, 'skyline-far').setOrigin(0).setScrollFactor(0).setDepth(-8);
  const near = scene.add.tileSprite(0, VIEW_H - 220, VIEW_W, 220, 'skyline-near').setOrigin(0).setScrollFactor(0).setDepth(-7);
  return (scrollX: number) => {
    clouds.tilePositionX = scrollX * 0.05 + scene.time.now * 0.004;
    far.tilePositionX = scrollX * 0.2;
    near.tilePositionX = scrollX * 0.45;
  };
}
