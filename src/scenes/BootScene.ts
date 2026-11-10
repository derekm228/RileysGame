import Phaser from 'phaser';
import { generateTextures, createAnimations } from '../art/textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    generateTextures(this);
    createAnimations(this);
    this.scene.start('TitleScene');
  }
}
