import { useCallback, useEffect, useState } from 'react';
import type { ConnectionStatus } from '@/types';

/** Reveals belong to one route and one live Management API connection. */
export function useQuotaReveal(routeKey: string, generation: number, connection: ConnectionStatus) {
  const scope = `${routeKey}:${generation}:${connection}`;
  const [state, setState] = useState<{ scope: string; names: Set<string> }>(() => ({
    scope,
    names: new Set(),
  }));
  useEffect(() => {
    setState((current) => (current.scope === scope ? current : { scope, names: new Set() }));
  }, [scope]);
  const revealedNames = state.scope === scope ? state.names : new Set<string>();
  const toggleReveal = useCallback(
    (key: string) => {
      setState((current) => {
        const names = new Set(current.scope === scope ? current.names : []);
        if (names.has(key)) names.delete(key);
        else names.add(key);
        return { scope, names };
      });
    },
    [scope]
  );
  const clearReveals = useCallback(() => setState({ scope, names: new Set() }), [scope]);
  return { revealedNames, toggleReveal, clearReveals };
}
