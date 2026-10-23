/**
 * Advertising-consent gate for the Meta pixel (banner route).
 * Region comes from same-origin /cdn-cgi/trace; on failure, non-OK, unknown (XX)
 * or Tor (T1) the visitor is treated as being in a consent region (banner shown).
 * Outside consent regions tracking stays enabled without a banner, honoring opt-outs.
 */

const EEA = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO",
  "SK", "SI", "ES", "SE",
];
export const CONSENT_REGIONS = new Set<string>([...EEA, "GB", "CH", "BR"]);

/** Version of the notice text shown when the visitor decided. */
export const NOTICE_VERSION = "2026-10-23";

/** Fired to reopen the banner from the footer's "Configurações de cookies". */
export const COOKIE_SETTINGS_EVENT = "oa:open-cookie-settings";

const REGION_CACHE_KEY = "oa:region";
const CONSENT_KEY = "oa:consent-advertising";

export type ConsentDecision = "accepted" | "refused";

export type ConsentRecord = {
  decision: ConsentDecision;
  at: string;
  region: string | null;
  noticeVersion: string;
};

/** Visitor country code, cached for the page visit. null = unknown (consent required). */
export async function getVisitorRegion(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(REGION_CACHE_KEY);
    if (cached) return cached === "?" ? null : cached;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("/cdn-cgi/trace", { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) {
      sessionStorage.setItem(REGION_CACHE_KEY, "?");
      return null;
    }
    const region = /^loc=(.*)$/m.exec(await res.text())?.[1]?.trim() ?? "";
    const unknown = !region || region === "XX" || region === "T1";
    sessionStorage.setItem(REGION_CACHE_KEY, unknown ? "?" : region);
    return unknown ? null : region;
  } catch {
    return null;
  }
}

export async function regionRequiresConsent(): Promise<boolean> {
  const region = await getVisitorRegion();
  return region === null || CONSENT_REGIONS.has(region);
}

function isRecord(v: unknown): v is ConsentRecord {
  return (
    typeof v === "object" &&
    v !== null &&
    ((v as ConsentRecord).decision === "accepted" || (v as ConsentRecord).decision === "refused") &&
    typeof (v as ConsentRecord).at === "string" &&
    typeof (v as ConsentRecord).noticeVersion === "string"
  );
}

/** The visitor's advertising choice with its evidence (when, region, notice version). */
export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persists the choice with evidence. Withdrawal overwrites acceptance (and is kept as refusal evidence). */
export async function writeConsent(decision: ConsentDecision): Promise<void> {
  if (typeof window === "undefined") return;
  const region = await getVisitorRegion();
  const record: ConsentRecord = {
    decision,
    at: new Date().toISOString(),
    region,
    noticeVersion: NOTICE_VERSION,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

/**
 * Whether ad tracking may run for this visitor: explicit acceptance inside consent
 * regions; outside them, enabled by default unless the visitor refused (opt-out honored).
 */
export async function advertisingPermitted(): Promise<boolean> {
  const record = readConsent();
  if (await regionRequiresConsent()) return record?.decision === "accepted";
  return record?.decision !== "refused";
}

/** True when the banner must be shown: consent required and no decision recorded yet. */
export async function needsConsentChoice(): Promise<boolean> {
  if (!(await regionRequiresConsent())) return false;
  return readConsent() === null;
}

/** Footer link helper: reopens the banner. The current choice stays in force until changed. */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
