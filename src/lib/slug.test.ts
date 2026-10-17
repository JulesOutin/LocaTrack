import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("removes accents and normalizes separators", () => {
    expect(slugify("Lycée Jean Moulin Été!")).toBe("lycee-jean-moulin-ete");
    expect(slugify("École Saint-Exupéry")).toBe("ecole-saint-exupery");
  });

  it("trims leading/trailing separators", () => {
    expect(slugify("  --Centre de formation--  ")).toBe("centre-de-formation");
  });

  it("returns an empty string for input with no usable characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
