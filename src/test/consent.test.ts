import { beforeEach, describe, expect, it } from "vitest";
import { CONSENT_REGIONS, advertisingPermitted, readConsent, writeConsent } from "@/lib/consent";

// In tests /cdn-cgi/trace is unreachable, so the region resolves to unknown and
// the consent-required default applies (banner route, fail-closed).

describe("advertising consent gate", () => {
  beforeEach(() => localStorage.clear());

  it("treats Brazil and the EEA as consent regions", () => {
    expect(CONSENT_REGIONS.has("BR")).toBe(true);
    expect(CONSENT_REGIONS.has("PT")).toBe(true);
    expect(CONSENT_REGIONS.has("US")).toBe(false);
  });

  it("denies tracking until the visitor decides", async () => {
    expect(await advertisingPermitted()).toBe(false);
    expect(readConsent()).toBeNull();
  });

  it("permits tracking after acceptance and records the evidence", async () => {
    await writeConsent("accepted");
    expect(await advertisingPermitted()).toBe(true);
    const rec = readConsent();
    expect(rec?.decision).toBe("accepted");
    expect(typeof rec?.at).toBe("string");
    expect(rec?.noticeVersion).toBe("2026-10-23");
  });

  it("keeps tracking off after refusal", async () => {
    await writeConsent("refused");
    expect(await advertisingPermitted()).toBe(false);
    expect(readConsent()?.decision).toBe("refused");
  });
});
