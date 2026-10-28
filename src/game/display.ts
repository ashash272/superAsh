/** Render at up to 2x density without making world units or UI physically larger. */
export const renderScale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
export const viewWidth = (scene: { scale: { width: number } }) => scene.scale.width / renderScale;
