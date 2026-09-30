import { describe, expect, it } from "vitest";
import { INLINE_BUDGET, cutToBudget, renderDemotedLine } from "./inline-budget.js";

describe("inline budget", () => {
  it("stays under Claude Code's measured 10,000-character inline cap", () => {
    expect(INLINE_BUDGET).toBeLessThan(10_000);
  });

  it("leaves a fitting render alone and cuts an oversized one at a line, saying so", () => {
    expect(cutToBudget("short\ntext")).toBe("short\ntext");
    const long = Array.from({ length: 2_000 }, (_, i) => `line ${i}`).join("\n");
    const cut = cutToBudget(long);
    expect(cut.length).toBeLessThanOrEqual(INLINE_BUDGET);
    expect(cut).toMatch(/line \d+\n\n\[Orientation cut to fit the inline limit; is_navigate shows the rest\.\]$/);
  });

  it("cuts a render with no line break inside the budget mid-line, still under it", () => {
    const cut = cutToBudget("x".repeat(20_000));
    expect(cut.length).toBeLessThanOrEqual(INLINE_BUDGET);
    expect(cut.endsWith("is_navigate shows the rest.]")).toBe(true);
  });

  it("names demoted files relative to the project and the verbs that read them", () => {
    expect(renderDemotedLine(["/space/_agent/agreement.md"], "/space")).toBe(
      "Summarised to fit the inline limit: _agent/agreement.md. Read it in full with Read before acting.",
    );
  });
});
