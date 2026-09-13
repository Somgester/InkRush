import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// jsdom in this setup doesn't expose localStorage, which JoinRoom reads on
// mount. Provide a minimal in-memory stub so component tests can run.
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string): string | null => store[key] ?? null,
        setItem: (key: string, value: string): void => {
            store[key] = value;
        },
        removeItem: (key: string): void => {
            delete store[key];
        },
        clear: (): void => {
            store = {};
        },
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

beforeEach(() => {
    localStorageMock.clear();
});
