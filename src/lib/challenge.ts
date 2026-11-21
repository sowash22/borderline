export function parseBeat(value: string | null): number | null {
  if (value == null || !/^\d{1,3}$/.test(value)) return null;
  const score = Number(value);
  if (score > 100) return null;
  return score;
}

export function challengeLine(score: number, beat: number): string {
  if (score > beat) return `You beat ${beat}%.`;
  if (score === beat) return `You tied ${beat}%.`;
  return `${beat}% still leads.`;
}
