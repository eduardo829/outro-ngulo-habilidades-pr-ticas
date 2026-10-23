import { useEffect, useState } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import {
  COOKIE_SETTINGS_EVENT,
  advertisingPermitted,
  getVisitorRegion,
  needsConsentChoice,
  writeConsent,
} from "@/lib/consent";
import { loadMetaPixel } from "@/lib/meta-pixel";

/**
 * Site-wide Meta pixel controller: loads the pixel when tracking is permitted and
 * shows the regional consent banner until the visitor decides. Mounted once in __root.
 */
export function MetaPixel() {
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    let stop = false;
    void (async () => {
      if (await advertisingPermitted()) {
        if (!stop) loadMetaPixel();
        return;
      }
      if (!stop && (await needsConsentChoice())) setBannerOpen(true);
    })();
    const open = () => setBannerOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, open);
    return () => {
      stop = true;
      window.removeEventListener(COOKIE_SETTINGS_EVENT, open);
    };
  }, []);

  const decide = async (accept: boolean) => {
    await writeConsent(accept ? "accepted" : "refused");
    setBannerOpen(false);
    if (accept) loadMetaPixel();
  };

  if (!bannerOpen) return null;
  return <ConsentBanner onAccept={() => void decide(true)} onRefuse={() => void decide(false)} />;
}
