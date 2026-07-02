import "@testing-library/jest-dom/vitest";

// Bun ships a native `localStorage`/`sessionStorage` global that's a no-op
// stub without `--localstorage-file` (getItem/setItem effectively no-op,
// `localStorage` itself reads as undefined). Since that global already
// exists on `globalThis`, vitest's jsdom environment setup skips overriding
// it with jsdom's working implementation — it only installs keys that are
// NOT already present. Polyfill a minimal Storage-compatible implementation
// so code under test that reads/writes localStorage works as expected.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

for (const key of ["localStorage", "sessionStorage"] as const) {
  Object.defineProperty(globalThis, key, {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}
