import "@testing-library/jest-dom";

if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
