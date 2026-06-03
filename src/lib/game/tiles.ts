export function encodeTile(a: number, b: number): number {
  if (a < 0 || a > 6 || b < 0 || b > 6) {
    throw new Error(`Tile values must be 0..6, got ${a}-${b}`);
  }
  if (a > b) {
    throw new Error(`Use sorted form a <= b, got ${a}-${b}`);
  }
  // Offset for first pip a = sum(7-i for i in 0..a-1) = a*7 - a*(a-1)/2
  const offset = a * 7 - (a * (a - 1)) / 2;
  return offset + (b - a);
}

export function decodeTile(id: number): [number, number] {
  if (id < 0 || id > 27) {
    throw new Error(`Tile id must be 0..27, got ${id}`);
  }
  let a = 0;
  let offset = 0;
  while (id >= offset + (7 - a)) {
    offset += 7 - a;
    a++;
  }
  return [a, a + (id - offset)];
}

export function allTileIds(): number[] {
  return Array.from({ length: 28 }, (_, i) => i);
}

export function tilePipSum(id: number): number {
  const [a, b] = decodeTile(id);
  return a + b;
}
