// Stable UTF-16 hash shared with the offline narration asset builder.
export function audioKey(text: string): string {
  let hash = 2166136261;
  const normalized = text.replace(/\s+/g, "");
  for (let i = 0; i < normalized.length; i++) {
    hash = Math.imul(hash ^ normalized.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
