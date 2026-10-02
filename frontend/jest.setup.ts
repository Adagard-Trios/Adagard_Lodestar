import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// The live screens render through the real ODataClient over a fake fetch, and the first render of a suite
// compiles the screen's whole module graph. On a loaded machine (several suites in parallel workers) that can
// take longer than RTL's 1 s findBy/waitFor default and jest's 5 s test default, which made suites fail on
// timing alone. The assertions are unchanged; only how long a real wait may take.
configure({ asyncUtilTimeout: 10_000 });
jest.setTimeout(30_000);

// jsdom's File/Blob has no text() (browsers do). The product reads files with a FileReader fallback
// (components/live/settings-data.ts readText); this keeps any other Blob.text() caller working under jsdom too.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Object.defineProperty(Blob.prototype, 'text', {
    configurable: true,
    writable: true,
    value(this: Blob) {
      return new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ''));
        r.onerror = () => reject(r.error);
        r.readAsText(this);
      });
    },
  });
}
