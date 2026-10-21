import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows the students photo in the hero", () => {
    render(<HomePage />);
    expect(screen.getByRole("img", { name: /young man and woman smiling/i })).toBeInTheDocument();
  });

  it("lists popular topics as class cards with a save toggle and carousel controls", async () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 2, name: "Our Popular Topics And Views" })).toBeInTheDocument();

    const card = screen.getByRole("heading", { level: 3, name: /paul emmanuel/i }).closest("article")!;
    expect(within(card).getByText("Basic 1")).toBeInTheDocument();
    expect(within(card).getByText("Mathematics")).toBeInTheDocument();
    expect(within(card).getByText("00:01:04")).toBeInTheDocument();

    const save = within(card).getByRole("button", { name: /save basic 1 mathematics/i });
    expect(save).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(save);
    expect(save).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByRole("button", { name: /previous classes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next classes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore all classes/i })).toHaveAttribute("href", "/available-tutorials");
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
