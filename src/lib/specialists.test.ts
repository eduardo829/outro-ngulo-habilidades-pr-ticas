import { describe, it, expect } from "vitest";
import { badgeFor, canShowBudget, canTalk, matchesSpecialist, missingForReview } from "./specialists";

const p = { categories: ["ia"], city: "Recife/PE", remote: true, verified_at: null, headline: "Automação com IA", specialties: ["n8n"], display_name: "Ana" };
const f = { category: "todas", place: "", verifiedOnly: false, q: "" };

describe("specialists", () => {
  it("seal only after admin verification", () => {
    expect(badgeFor({ status: "approved", verified_at: null })).toBe("registered");
    expect(badgeFor({ status: "approved", verified_at: "2026-11-03" })).toBe("verified");
    expect(badgeFor({ status: "pending", verified_at: "2026-11-03" })).toBe(null);
  });
  it("no public budget for law", () => expect(canShowBudget(["juridico"])).toBe(false));
  it("accountants may show their price range", () => {
    expect(canShowBudget(["financas"])).toBe(true);
    expect(canShowBudget(["financas", "juridico"])).toBe(false);
    expect(canShowBudget(["ia", "marketing"])).toBe(true);
  });
  it("verified-only filter hides unverified", () => expect(matchesSpecialist(p, { ...f, verifiedOnly: true })).toBe(false));
  it("search matches specialties", () => expect(matchesSpecialist(p, { ...f, q: "N8N" })).toBe(true));
  it("remote filter", () => expect(matchesSpecialist({ ...p, remote: false }, { ...f, place: "remoto" })).toBe(false));
  it("review requires consent", () => expect(missingForReview({ headline: "Contador", about: "x".repeat(50), categories: ["financas"], consent_public: false })).toContain("autorização para exibir o perfil"));
  it("conversation only after accepted interest", () => { expect(canTalk("pending")).toBe(false); expect(canTalk("accepted")).toBe(true); });
});
