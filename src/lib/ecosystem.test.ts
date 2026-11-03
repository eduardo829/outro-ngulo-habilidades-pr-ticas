import { describe, it, expect } from "vitest";
import { matchesOpportunity } from "./ecosystem";
const o = { category: "socio", city: "Curitiba/PR", remote: false, status: "open" };
describe("opportunity filters", () => {
  it("hides closed when only open", () => expect(matchesOpportunity({ ...o, status: "closed" }, { category: "todas", place: "", openOnly: true })).toBe(false));
  it("filters by category", () => expect(matchesOpportunity(o, { category: "servicos", place: "", openOnly: false })).toBe(false));
  it("remote filter requires remote", () => expect(matchesOpportunity(o, { category: "todas", place: "remoto", openOnly: false })).toBe(false));
  it("city match is case-insensitive", () => expect(matchesOpportunity(o, { category: "todas", place: "curitiba", openOnly: true })).toBe(true));
});
