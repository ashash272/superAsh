import Phaser from 'phaser';
// Original procedural equipment/terrain. Ash uses the approved animation atlas.
export function createArt(scene: Phaser.Scene) {
  const make = (
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ) => {
    const g = scene.make.graphics({ x: 0, y: 0 });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make('ash', 24, 38, (g) => {
    g.fillStyle(0x332139);
    g.fillRect(5, 28, 6, 9);
    g.fillRect(14, 28, 6, 9);
    g.fillStyle(0x201a2b);
    g.fillRect(3, 35, 8, 3);
    g.fillRect(14, 35, 8, 3);
    g.fillStyle(0xe7d6b5);
    g.fillRect(4, 18, 16, 13);
    g.fillRect(1, 20, 4, 10);
    g.fillRect(20, 20, 4, 10);
    g.fillStyle(0x9c6256);
    g.fillRect(5, 2, 15, 20);
    g.fillRect(3, 6, 19, 12);
    g.fillRect(8, 19, 7, 8);
    g.fillStyle(0xc48a66);
    g.fillRect(7, 7, 11, 12);
    g.fillStyle(0xe2ad81);
    g.fillRect(8, 8, 9, 9);
    g.fillStyle(0x322138);
    g.fillRect(8, 10, 3, 1);
    g.fillRect(14, 10, 3, 1);
    g.fillRect(9, 12, 1, 2);
    g.fillRect(15, 12, 1, 2);
    g.fillRect(9, 8, 1, 1);
    g.fillStyle(0x9c4e50);
    g.fillRect(11, 16, 4, 1);
  });
  make('star', 20, 20, (g) => {
    g.fillStyle(0xffd88a);
    g.fillPoints(
      [
        { x: 10, y: 0 },
        { x: 13, y: 7 },
        { x: 20, y: 10 },
        { x: 13, y: 13 },
        { x: 10, y: 20 },
        { x: 7, y: 13 },
        { x: 0, y: 10 },
        { x: 7, y: 7 },
      ],
      true,
    );
    g.fillStyle(0xfff8d8);
    g.fillRect(9, 6, 2, 7);
  });
  make('arrow', 32, 8, (g) => {
    g.fillStyle(0xe3cb9b);
    g.fillRect(1, 3, 25, 2);
    g.fillStyle(0x7ce8d7);
    g.fillTriangle(24, 0, 32, 4, 24, 8);
    g.fillStyle(0xd99cf8);
    g.fillRect(1, 0, 5, 3);
    g.fillRect(1, 5, 5, 3);
  });
  make('target', 36, 36, (g) => {
    [0x60456c, 0xead3ab, 0xb66d83, 0xead3ab, 0x65dacc].forEach((c, i) => {
      g.fillStyle(c);
      g.fillCircle(18, 18, 18 - i * 3.4);
    });
  });
  make('tile', 48, 48, (g) => {
    g.fillStyle(0x242239);
    g.fillRect(0, 0, 48, 48);
    g.fillStyle(0x434059);
    g.fillRect(1, 8, 22, 15);
    g.fillRect(26, 8, 21, 15);
    g.fillRect(5, 26, 30, 14);
    g.fillStyle(0x5b506f);
    g.fillRect(2, 9, 20, 3);
    g.fillRect(27, 9, 18, 2);
    g.fillStyle(0x477b7c);
    g.fillRect(0, 0, 48, 7);
    g.fillStyle(0x7fe0bc);
    g.fillRect(0, 0, 48, 2);
    g.fillRect(7, 5, 4, 7);
    g.fillRect(32, 5, 3, 10);
  });
  make('pixel', 3, 3, (g) => {
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 3, 3);
  });
  make('bug', 40, 28, (g) => {
    g.fillStyle(0x362440);
    g.fillRect(7, 5, 26, 18);
    g.fillStyle(0xb55a9c);
    g.fillRect(10, 3, 20, 20);
    g.fillStyle(0xe887bb);
    g.fillRect(12, 4, 16, 6);
    g.fillStyle(0xffd9df);
    g.fillRect(12, 11, 5, 4);
    g.fillRect(24, 11, 5, 4);
    g.fillStyle(0x28203a);
    g.fillRect(15, 11, 2, 4);
    g.fillRect(24, 11, 2, 4);
    g.fillStyle(0xd692cb);
    for (let i = 0; i < 3; i++) {
      g.fillRect(2, 7 + i * 7, 8, 3);
      g.fillRect(30, 7 + i * 7, 8, 3);
    }
    g.fillRect(12, 0, 3, 5);
    g.fillRect(26, 0, 3, 5);
  });
  make('boss', 96, 96, (g) => {
    g.fillStyle(0x392443);
    g.fillPoints(
      [
        { x: 48, y: 4 },
        { x: 70, y: 20 },
        { x: 88, y: 15 },
        { x: 83, y: 48 },
        { x: 94, y: 70 },
        { x: 67, y: 76 },
        { x: 48, y: 93 },
        { x: 28, y: 75 },
        { x: 5, y: 70 },
        { x: 14, y: 45 },
        { x: 9, y: 17 },
        { x: 29, y: 22 },
      ],
      true,
    );
    g.fillStyle(0x86539e);
    g.fillRect(24, 25, 50, 47);
    g.fillStyle(0xb674b5);
    g.fillRect(29, 29, 39, 36);
    g.fillStyle(0x261b38);
    g.fillRect(31, 38, 12, 10);
    g.fillRect(54, 38, 12, 10);
    g.fillRect(38, 58, 22, 5);
    g.fillStyle(0xc9fff0);
    g.fillRect(35, 40, 7, 5);
    g.fillRect(54, 40, 7, 5);
    g.fillStyle(0xd29ada);
    g.fillRect(14, 20, 10, 8);
    g.fillRect(75, 66, 9, 8);
    g.fillRect(16, 72, 8, 7);
  });
}
