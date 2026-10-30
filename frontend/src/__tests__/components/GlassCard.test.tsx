import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GlassCard from "@/components/ui/GlassCard";

describe("GlassCard component", () => {
  it("renders children correctly", () => {
    render(<GlassCard>Card Content</GlassCard>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("handles click and enter key interaction when onClick is provided", () => {
    const handleClick = vi.fn();
    render(<GlassCard onClick={handleClick}>Interactive Card</GlassCard>);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("applies hoverable and custom padding classes", () => {
    const { container } = render(
      <GlassCard hoverable padding="sm" className="custom-class">
        Padded Card
      </GlassCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("p-4");
    expect(card.className).toContain("hover:border-slate-300");
    expect(card.className).toContain("custom-class");
  });
});
