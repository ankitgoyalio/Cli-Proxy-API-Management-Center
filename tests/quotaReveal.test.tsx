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
  }: {
    routeKey: string;
    generation: number;
    connection: ConnectionStatus;
  }) {
    reveal = useQuotaReveal(routeKey, generation, connection);
    return createElement(
      'div',
      null,
      createElement(
        'span',
        null,
        reveal.revealedNames.has('first') ? 'first visible' : 'first masked'
      ),
      createElement(
        'span',
        null,
        reveal.revealedNames.has('second') ? 'second visible' : 'second masked'
      )
    );
  }
  const render = async (routeKey: string, generation: number, connection: ConnectionStatus) =>
    act(async () => root.render(createElement(Harness, { routeKey, generation, connection })));

  await render('route-a', 1, 'connected');
  await act(async () => reveal.toggleReveal('first'));
  expect(host.textContent).toContain('first visible');
  expect(host.textContent).toContain('second masked');
  await render('route-b', 1, 'connected');
  expect(host.textContent).toContain('first masked');
  await act(async () => reveal.toggleReveal('first'));
  await render('route-b', 2, 'connected');
  expect(host.textContent).toContain('first masked');
  await act(async () => reveal.toggleReveal('first'));
  await render('route-b', 2, 'disconnected');
  expect(host.textContent).toContain('first masked');
  await render('route-b', 2, 'connected');
  expect(host.textContent).toContain('first masked');
  await act(async () => root.unmount());
  host.remove();
});
