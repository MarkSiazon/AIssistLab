import assert from "node:assert/strict";
import {
  getBrowserLocalStorage,
  getBrowserSessionStorage,
} from "./browser-storage";

type GlobalWithWindow = typeof globalThis & { window?: unknown };

function withWindow<T>(value: unknown, fn: () => T): T {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
  });

  try {
    return fn();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "window", descriptor);
    } else {
      delete (globalThis as GlobalWithWindow).window;
    }
  }
}

function createStorage() {
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
try {
  if (originalDescriptor) {
    delete (globalThis as GlobalWithWindow).window;
  }
  assert.equal(getBrowserLocalStorage(), null);
  assert.equal(getBrowserSessionStorage(), null);
} finally {
  if (originalDescriptor) {
    Object.defineProperty(globalThis, "window", originalDescriptor);
  }
}

const localStorage = createStorage();
const sessionStorage = createStorage();
withWindow({ localStorage, sessionStorage }, () => {
  assert.equal(getBrowserLocalStorage(), localStorage);
  assert.equal(getBrowserSessionStorage(), sessionStorage);
});

const blockedWindow = {};
Object.defineProperty(blockedWindow, "localStorage", {
  configurable: true,
  get() {
    throw new DOMException("blocked", "SecurityError");
  },
});
Object.defineProperty(blockedWindow, "sessionStorage", {
  configurable: true,
  get() {
    throw new DOMException("blocked", "SecurityError");
  },
});

withWindow(blockedWindow, () => {
  assert.equal(getBrowserLocalStorage(), null);
  assert.equal(getBrowserSessionStorage(), null);
});

console.log("Browser storage helper tests passed");
