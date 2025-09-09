export function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  // React Native polyfill
  return Buffer.from(str, 'utf-8').toString('base64');
}

export function base64Decode(str: string): string {
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(str)));
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}
