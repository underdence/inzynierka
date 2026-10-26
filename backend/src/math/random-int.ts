export function randomInt(min: number, max: number): number {
  const rangeSize = max - min + 1;
  const offset = Math.floor(Math.random() * rangeSize);

  return offset + min;
}
