/**
 * Meta Pixel (browser reporting only). Loading and every event go through the
 * advertising-consent gate in ./consent — no consent-required visitor, no hits.
 */
import { advertisingPermitted } from "./consent";

export const META_PIXEL_ID = "1427453789455130";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let loaded = false;

/** Loads the base snippet once and fires PageView. Call only after consent is permitted. */
export function loadMetaPixel(): void {
  if (typeof window === "undefined" || loaded) return;
  if (window.fbq) {
    loaded = true;
    return;
  }
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window._fbq = window.fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", META_PIXEL_ID, {}, { agent: "lovable" });
  fbq("track", "PageView");
  loaded = true;
}

/** Fires a conversion only when tracking is permitted for this visitor. */
export async function trackConversionEvent(
  event: "InitiateCheckout" | "Purchase",
  params?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined" || !(await advertisingPermitted())) return;
  loadMetaPixel();
  window.fbq?.("track", event, params ?? {});
}
