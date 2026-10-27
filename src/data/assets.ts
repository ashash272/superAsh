/** Resolve public assets below the deployed base, while preserving external media URLs. */
export function assetUrl(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}
