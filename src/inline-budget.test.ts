import { describe, expect, it } from "vitest";
import { INLINE_BUDGET, cutToBudget, fitToBudget, renderDemotedLine } from "./inline-budget.js";

describe("inline budget", () => {
  it("stays under Claude Code's measured 10,000-character inline cap", () => {
    expect(INLINE_BUDGET).toBeLessThan(10_000);
  });

  it("leaves a fitting render alone and cuts an oversized one at a line, saying so", () => {
    expect(cutToBudget("short\ntext")).toBe("short\ntext");
    const long = Array.from({ length: 2_000 }, (_, i) => `line ${i}`).join("\n");
    const cut = cutToBudget(long);
    expect(cut.length).toBeLessThanOrEqual(INLINE_BUDGET);
    expect(cut).toMatch(/line \d+\n\n\[Orientation cut here to fit the inline limit; is_navigate shows the position in full\.\]$/);
  });

  it("cuts a render with no line break inside the budget mid-line, still under it", () => {
    const cut = cutToBudget("x".repeat(20_000));
    expect(cut.length).toBeLessThanOrEqual(INLINE_BUDGET);
    expect(cut.endsWith("is_navigate shows the position in full.]")).toBe(true);
  });

  it("cuts the head and keeps the tail whole", () => {
    const head = Array.from({ length: 2_000 }, (_, i) => `head ${i}`).join("\n");
    const tail = "State:\n  branch: main\n\nChange open: chg_keep-0001";
    const fitted = fitToBudget(head, tail);
    expect(fitted.length).toBeLessThanOrEqual(INLINE_BUDGET);
    expect(fitted.endsWith(tail)).toBe(true);
    expect(fitted).toContain("[Orientation cut here to fit the inline limit");
    expect(fitToBudget("head", tail)).toBe(`head\n\n${tail}`);
  });

  it("names demoted files relative to the project and the verbs that read them", () => {
    expect(renderDemotedLine(["/space/_agent/agreement.md"], "/space")).toBe(
      "Summarised to fit the inline limit: _agent/agreement.md. Read it in full with Read before acting.",
    );
  });
});
