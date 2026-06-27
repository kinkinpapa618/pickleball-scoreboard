import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";

// Mock the beforeinstallprompt event
class MockBeforeInstallPromptEvent extends Event {
  prompt = vi.fn();
  userChoice = Promise.resolve({ outcome: "accepted" });
  constructor() {
    super("beforeinstallprompt");
  }
}

describe("PWA install prompt", () => {
  it("should display Install button when beforeinstallprompt is fired", async () => {
    render(<App />);
    const event = new MockBeforeInstallPromptEvent();
    window.dispatchEvent(event);
    const installButton = await screen.findByRole("button", { name: /Install App/i });
    expect(installButton).toBeTruthy();
    fireEvent.click(installButton);
    expect(event.prompt).toHaveBeenCalled();
  });
});
