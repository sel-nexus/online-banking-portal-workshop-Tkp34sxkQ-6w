import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import App from '../src/App';

const CURRENT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIRECTORY = path.resolve(CURRENT_DIRECTORY, '../src');

function getSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(entryPath);
    }

    if (
      entry.isFile() &&
      /\.(js|jsx)$/.test(entry.name) &&
      !/(\.test|\.spec)\.(js|jsx)$/.test(entry.name)
    ) {
      return [entryPath];
    }

    return [];
  });
}

function readApplicationSource() {
  return getSourceFiles(SOURCE_DIRECTORY)
    .map((filePath) => ({
      filePath: path.relative(SOURCE_DIRECTORY, filePath),
      source: fs.readFileSync(filePath, 'utf8'),
    }))
    .filter(({ source }) => source.trim())
    .map(({ filePath, source }) => `\n/* ${filePath} */\n${source}`)
    .join('\n');
}

function replaceGlobal(name, replacement) {
  const hadOwnProperty = Object.prototype.hasOwnProperty.call(globalThis, name);
  const originalValue = globalThis[name];

  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value: replacement,
  });

  return () => {
    if (hadOwnProperty) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value: originalValue,
      });
    } else {
      delete globalThis[name];
    }
  };
}

function replaceNavigatorMethod(name, replacement) {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, name);

  Object.defineProperty(navigator, name, {
    configurable: true,
    writable: true,
    value: replacement,
  });

  return () => {
    if (descriptor) {
      Object.defineProperty(navigator, name, descriptor);
    } else {
      delete navigator[name];
    }
  };
}

describe('No-network application paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('contains no direct network, beacon, server integration, or external analytics APIs', () => {
    const source = readApplicationSource();

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\bXMLHttpRequest\b/);
    expect(source).not.toMatch(/\bWebSocket\b/);
    expect(source).not.toMatch(/\bEventSource\b/);
    expect(source).not.toMatch(/\bsendBeacon\s*\(/);
    expect(source).not.toMatch(/\b(import|require)\s*\(\s*['"][^'"]*(?:axios|node-fetch|socket\.io|sentry|mixpanel|posthog|segment)[^'"]*['"]\s*\)/i);
    expect(source).not.toMatch(/\b(?:gtag|ga|googleAnalytics|analytics\.track|mixpanel|posthog|sentry)\s*\(/i);
    expect(source).not.toMatch(/\bprocess\.env\b/);
    expect(source).not.toMatch(/\b(?:express|koa|fastify|http\.createServer|https\.createServer)\b/);
    expect(source).not.toMatch(/['"`](?:https?|wss?):\/\/[^'"`\s]+['"`]/i);
    expect(source).not.toMatch(/['"`]\/(?:api|graphql)(?:\/|['"`])/i);
  });

  it('does not invoke browser network primitives while rendering the application', () => {
    const fetchMock = vi.fn();
    const xhrMock = vi.fn();
    const beaconMock = vi.fn();

    const restoreFetch = replaceGlobal('fetch', fetchMock);
    const restoreXhr = replaceGlobal('XMLHttpRequest', xhrMock);
    const restoreBeacon = replaceNavigatorMethod('sendBeacon', beaconMock);

    try {
      render(<App />);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(xhrMock).not.toHaveBeenCalled();
      expect(beaconMock).not.toHaveBeenCalled();
    } finally {
      restoreBeacon();
      restoreXhr();
      restoreFetch();
    }
  });
});