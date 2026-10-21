import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";
import { ContactPage, FaqPage, HowItWorksPage, PartnersPage, AgentsPage, TutorialsPage } from "./MarketingPages";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("marketing home page", () => {
  it("presents the primary student journey", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A good education is the foundation");
    expect(screen.getAllByRole("link", { name: /start learning/i })[0]).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("heading", { name: /from sign-up to study time/i })).toBeInTheDocument();
  });

  it("links the header to each marketing page, like the live site", () => {
    render(<HomePage />);
    const nav = screen.getByRole("navigation", { name: /main navigation/i });
    const hrefs = within(nav).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/how-it-works", "/available-tutorials", "/our-agents", "/our-partners", "/faq", "/contact"]);
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });
});

describe("marketing inner pages", () => {
  it.each([
    ["How it works", HowItWorksPage, "How it Works"],
    ["Tutorials", TutorialsPage, "Available Tutorials"],
    ["Agents", AgentsPage, "Our Agents"],
    ["Partners", PartnersPage, "Our Partners"],
    ["FAQ", FaqPage, "Frequently Asked Questions"],
    ["Contact", ContactPage, "Contact Us"],
  ])("%s page has a single h1 and the shared footer", (_name, Page, title) => {
    render(<Page />);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(title);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
