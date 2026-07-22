/** Seeded hash32 RNG — deterministic for debug/replay */

export function hash32(...parts: Array<string | number>): number {
  let h = 2166136261 >>> 0;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0xff;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Returns 0..9999 inclusive */
export function rollD10000(seed: string, actionType: string, actionIndex: number): number {
  return hash32(seed, actionType, actionIndex) % 10000;
}

export function unit01(seed: string, actionType: string, actionIndex: number): number {
  return rollD10000(seed, actionType, actionIndex) / 10000;
}

export function pickWeighted<T extends string>(
  seed: string,
  actionType: string,
  actionIndex: number,
  weights: Record<T, number>
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = unit01(seed, actionType, actionIndex) * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}
