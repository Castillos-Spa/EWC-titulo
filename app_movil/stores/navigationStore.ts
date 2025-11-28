import { create } from 'zustand';

type Usage = { lastVisited: number; count: number };

interface NavigationState {
  usage: Record<string, Usage>;
  markUsed: (route: string) => void;
  getTop: (candidates: string[], limit: number) => string[];
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  usage: {},
  markUsed: (route: string) => {
    if (!route) return;
    set((state) => {
      const prev = state.usage[route] || { lastVisited: 0, count: 0 };
      return {
        usage: {
          ...state.usage,
          [route]: { lastVisited: Date.now(), count: prev.count + 1 },
        },
      };
    });
  },
  getTop: (candidates: string[], limit: number) => {
    const usage = get().usage;
    const scored = candidates.map((r) => ({
      route: r,
      score: (usage[r]?.count || 0) * 10 + (usage[r]?.lastVisited || 0),
    }));
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    return sorted.slice(0, Math.max(0, limit)).map((s) => s.route);
  },
}));
