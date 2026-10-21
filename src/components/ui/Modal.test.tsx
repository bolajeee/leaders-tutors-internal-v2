import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import ModalShell from "./ModalShell";
import { OtpInput } from "@/components/form/OtpInput";

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <ModalShell
        isOpen={open}
        title="Example dialog"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <div className="p-4">
          <input aria-label="First field" />
          <button>Confirm</button>
        </div>
      </ModalShell>
    </>
  );
}

describe("modal semantics", () => {
  it("is a labelled modal dialog that locks background scrolling", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog", { name: "Example dialog" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("moves focus inside, traps Tab, and returns focus when closed with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole("button", { name: "Open dialog" });
    await user.click(opener);

    const close = screen.getByRole("button", { name: "Close dialog" });
    expect(close).toHaveFocus();

    // Tab cycles within the dialog only.
    await user.tab();
    expect(screen.getByLabelText("First field")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("closes from the backdrop and the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.pointer({ keys: "[MouseLeft]", target: screen.getByRole("dialog").parentElement as HTMLElement });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("only lets the topmost of nested dialogs react to Escape", async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <ModalShell isOpen title="Outer" onClose={outer}>
          <button>outer action</button>
        </ModalShell>
        <ModalShell isOpen title="Inner" onClose={inner}>
          <button>inner action</button>
        </ModalShell>
      </>,
    );
    await user.keyboard("{Escape}");
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("ignores dismissal while an action is in flight", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ModalShell isOpen title="Busy" onClose={onClose} dismissible={false}>
        <p>Working…</p>
      </ModalShell>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeDisabled();
  });
});

describe("one-time code input", () => {
  function Otp() {
    const [value, setValue] = useState("");
    return (
      <>
        <OtpInput value={value} onChange={setValue} />
        <output aria-label="current value">{value}</output>
      </>
    );
  }

  it("moves between digits as the student types and deletes backwards", async () => {
    const user = userEvent.setup();
    render(<Otp />);
    await user.click(screen.getByLabelText("Digit 1 of 6"));
    await user.keyboard("123");
    expect(screen.getByLabelText("Digit 4 of 6")).toHaveFocus();
    expect(screen.getByLabelText("current value")).toHaveTextContent("123");
    await user.keyboard("{Backspace}");
    expect(screen.getByLabelText("Digit 3 of 6")).toHaveFocus();
    expect(screen.getByLabelText("current value")).toHaveTextContent("12");
  });

  it("ignores non-digits and accepts a pasted code", async () => {
    const user = userEvent.setup();
    render(<Otp />);
    await user.click(screen.getByLabelText("Digit 1 of 6"));
    await user.keyboard("ab");
    expect(screen.getByLabelText("current value")).toHaveTextContent("");
    await user.paste("12 34-56");
    expect(screen.getByLabelText("current value")).toHaveTextContent("123456");
    expect(screen.getByLabelText("Digit 6 of 6")).toHaveFocus();
  });

  it("supports arrow-key navigation and a one-time-code hint", async () => {
    const user = userEvent.setup();
    render(<Otp />);
    expect(screen.getByLabelText("Digit 1 of 6")).toHaveAttribute("autocomplete", "one-time-code");
    await user.click(screen.getByLabelText("Digit 3 of 6"));
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByLabelText("Digit 2 of 6")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByLabelText("Digit 4 of 6")).toHaveFocus();
  });
});
