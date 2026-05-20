export interface ProviderScoreInput {
  name: string;
  healthy: boolean;
  avgLatencyMs: number;
  costRank: number; // lower is cheaper
  priority: number; // higher is preferred
}

export function scoreProvider(p: ProviderScoreInput): number {
  if (!p.healthy) return -Infinity;
  const latencyScore = Math.max(0, 1000 - p.avgLatencyMs) / 10;
  const costScore = Math.max(0, 10 - p.costRank) * 10;
  const priorityScore = p.priority * 25;
  return latencyScore + costScore + priorityScore;
}

export function pickBestProvider(providers: ProviderScoreInput[]): ProviderScoreInput | null {
  const ranked = providers
    .map((p) => ({ p, score: scoreProvider(p) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score === -Infinity ? null : ranked[0]?.p ?? null;
}
