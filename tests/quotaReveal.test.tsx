import { afterAll, expect, test } from 'bun:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Window } from 'happy-dom';
import { useQuotaReveal } from '../src/features/quota/hooks/useQuotaReveal';
import type { ConnectionStatus } from '../src/types';

const browserWindow = new Window();
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalAct = Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
Object.assign(globalThis, { window: browserWindow, document: browserWindow.document });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterAll(async () => {
  for (const [name, descriptor] of [
    ['document', originalDocument],
    ['window', originalWindow],
    ['IS_REACT_ACT_ENVIRONMENT', originalAct],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  await browserWindow.happyDOM.close();
});

test('quota reveals are independent and reset on route, connection, or session change', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let reveal: ReturnType<typeof useQuotaReveal>;
  function Harness({
    routeKey,
    generation,
    connection,
    currentLayer,
  }: {
    routeKey: string;
    generation: number;
    connection: ConnectionStatus;
    currentLayer: boolean;
  }) {
    reveal = useQuotaReveal(routeKey, generation, connection, currentLayer);
    return createElement(
      'div',
      null,
      createElement(
        'span',
        null,
        reveal.cardRevealedNames.has('first') ? 'card visible' : 'card masked'
      ),
      createElement(
        'span',
        null,
        reveal.timelineRevealedNames.has('first') ? 'timeline visible' : 'timeline masked'
      )
    );
  }
  const render = async (
    routeKey: string,
    generation: number,
    connection: ConnectionStatus,
    currentLayer = true
  ) =>
    act(async () =>
      root.render(createElement(Harness, { routeKey, generation, connection, currentLayer }))
    );

  await render('route-a', 1, 'connected');
  await act(async () => reveal.toggleCardReveal('first'));
  expect(host.textContent).toContain('card visible');
  expect(host.textContent).toContain('timeline masked');
  await act(async () => reveal.toggleTimelineReveal('first'));
  expect(host.textContent).toContain('card visible');
  expect(host.textContent).toContain('timeline visible');
  await render('route-b', 1, 'connected');
  expect(host.textContent).toContain('card masked');
  expect(host.textContent).toContain('timeline masked');
  await act(async () => reveal.toggleCardReveal('first'));
  await render('route-b', 2, 'connected');
  expect(host.textContent).toContain('card masked');
  await act(async () => reveal.toggleCardReveal('first'));
  await render('route-b', 2, 'connected', false);
  expect(host.textContent).toContain('card masked');
  await render('route-b', 2, 'connected');
  expect(host.textContent).toContain('card masked');
  await act(async () => reveal.toggleCardReveal('first'));
  await render('route-b', 2, 'disconnected');
  expect(host.textContent).toContain('card masked');
  await render('route-b', 2, 'connected');
  expect(host.textContent).toContain('card masked');
  await act(async () => root.unmount());
  host.remove();
});
