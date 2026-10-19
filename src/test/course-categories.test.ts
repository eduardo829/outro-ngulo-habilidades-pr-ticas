import { describe, expect, it } from "vitest";
import { AREAS, areaOf } from "@/lib/learning/catalog";
import { CORRETOR } from "@/lib/learning/corretor";
import { CORRETOR_PRATICA } from "@/lib/learning/corretor-pratica";

describe("Dedicated real-estate catalog category", () => {
  it("provides the Corretores filter", () => {
    expect(AREAS).toContain("Corretores");
  });
  it.each([CORRETOR, CORRETOR_PRATICA])("classifies $slug under Corretores rather than Profissões", (course) => {
    expect(course.category).toBe("Corretores");
    expect(areaOf(course)).toBe("Corretores");
  });
});