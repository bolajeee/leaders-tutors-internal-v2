import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage";

describe("marketing home page", () => {
  it("presents the primary student journey", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A stronger education");
    expect(screen.getAllByRole("link", { name: /start learning/i })[0]).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("heading", { name: /from sign-up to study time/i })).toBeInTheDocument();
  });
});
