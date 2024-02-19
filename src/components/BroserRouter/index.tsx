import { useCallback, useLayoutEffect, useRef, useState, startTransition } from 'react';
import { Router } from 'react-router-dom';
import type { NavigationType, BrowserRouterProps } from 'react-router-dom';
import { createBrowserHistory, BrowserHistory, Location } from '@remix-run/router';

interface RouterStore {
  updateHistory(history: BrowserHistory): void;
  updateLocation(location: Location): void;
}

export interface BrowserRouterPropsWithStore extends BrowserRouterProps {
  store?: RouterStore;
}

/**
 * https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/index.tsx#L756
 */
export function BrowserRouter({ basename, children, future, window, store }: BrowserRouterPropsWithStore) {
  const historyRef = useRef<BrowserHistory>();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window, v5Compat: true });
  }

  const history = historyRef.current;
  const [state, setStateImpl] = useState({
    action: history.action,
    location: history.location,
  });
  const { v7_startTransition } = future || {};
  const setState = useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      v7_startTransition && startTransition ? startTransition(() => setStateImpl(newState)) : setStateImpl(newState);
      store?.updateLocation(newState.location);
    },
    [setStateImpl, v7_startTransition, store]
  );

  useLayoutEffect(() => {
    store?.updateHistory(history);
    return history.listen(setState);
  }, [history, setState, store]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
      future={future}
    />
  );
}
