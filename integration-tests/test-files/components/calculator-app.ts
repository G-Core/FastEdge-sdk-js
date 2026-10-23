import { add, divide, sum } from 'acme:calc/arith';
import { describe } from 'acme:calc/format';
import { Accumulator } from 'acme:calc/memory';

function handle(url: URL): Response {
  const a = Number(url.searchParams.get('a'));
  const b = Number(url.searchParams.get('b'));
  switch (url.pathname) {
    case '/add': {
      return new Response(String(add(a, b)));
    }
    case '/divide': {
      try {
        return new Response(describe({ op: '/', a, b }, divide(a, b)));
      } catch (error) {
        return new Response(String((error as { payload: unknown }).payload), { status: 400 });
      }
    }
    case '/sum': {
      return new Response(String(sum(Float64Array.from(url.searchParams.getAll('v'), Number))));
    }
    case '/accumulate': {
      const acc = new Accumulator(0);
      for (const v of url.searchParams.getAll('v')) acc.add(Number(v));
      const merged = Accumulator.merge(acc, new Accumulator(10));
      return new Response(`${acc.total()} ${merged.total()}`);
    }
    default: {
      return new Response('not found', { status: 404 });
    }
  }
}

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handle(new URL(event.request.url)));
});
