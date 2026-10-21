import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(() => {
  cleanup();
  localStorage.clear();
  location.hash = "";
});
window.scrollTo = vi.fn();
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};

// jsdom has no audio device; behavioral audio tests supply stateful media mocks.
HTMLMediaElement.prototype.pause = vi.fn();

// jsdom omits layout scrolling; browsers implement this API.
HTMLElement.prototype.scrollIntoView = vi.fn();

// The scroll viewport uses the native element API rather than window scrolling.
HTMLElement.prototype.scrollTo = vi.fn();
