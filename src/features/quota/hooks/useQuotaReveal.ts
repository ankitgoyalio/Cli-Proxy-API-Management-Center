import { useCallback, useEffect, useState } from 'react';
import type { ConnectionStatus } from '@/types';

/** Reveals belong to one route and one live Management API connection. */
export function useQuotaReveal(
  routeKey: string,
  generation: number,
  connection: ConnectionStatus,
  isCurrentLayer = true
) {
  const scope = `${routeKey}:${generation}:${connection}:${isCurrentLayer}`;
  const [state, setState] = useState<{ scope: string; cards: Set<string>; timeline: Set<string> }>(
    () => ({
      scope,
      cards: new Set(),
      timeline: new Set(),
    })
  );
  useEffect(() => {
    setState((current) =>
      current.scope === scope ? current : { scope, cards: new Set(), timeline: new Set() }
    );
  }, [scope]);
  const cardRevealedNames = state.scope === scope ? state.cards : new Set<string>();
  const timelineRevealedNames = state.scope === scope ? state.timeline : new Set<string>();
  const toggle = useCallback(
    (surface: 'cards' | 'timeline', key: string) => {
      setState((current) => {
        const names = new Set(current.scope === scope ? current[surface] : []);
        if (names.has(key)) names.delete(key);
        else names.add(key);
        return {
          scope,
          cards: surface === 'cards' ? names : current.scope === scope ? current.cards : new Set(),
          timeline:
            surface === 'timeline' ? names : current.scope === scope ? current.timeline : new Set(),
        };
      });
    },
    [scope]
  );
  const toggleCardReveal = useCallback((key: string) => toggle('cards', key), [toggle]);
  const toggleTimelineReveal = useCallback((key: string) => toggle('timeline', key), [toggle]);
  const clearReveals = useCallback(
    () => setState({ scope, cards: new Set(), timeline: new Set() }),
    [scope]
  );
  return {
    cardRevealedNames,
    timelineRevealedNames,
    toggleCardReveal,
    toggleTimelineReveal,
    clearReveals,
  };
}
