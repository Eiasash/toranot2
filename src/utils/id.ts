let counter = 0;

export function generateId(prefix = ""): string {
  counter++;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now()}-${counter}-${rand}`;
}
