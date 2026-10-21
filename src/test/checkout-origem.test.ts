import { describe, expect, it } from "vitest";
import { origemFromSearch, origemParam } from "@/lib/checkout-logic";

// Campaign rule: /corretor-na-pratica?origem=... must reach the purchase row,
// sanitized (lowercase, URL-safe, max 40 chars); anything else is dropped.
describe("origem de campanha", () => {
  it("aceita origem simples e normaliza para minúsculas", () => {
    expect(origemParam("Instagram")).toBe("instagram");
    expect(origemParam("WhatsApp-Grupo_1")).toBe("whatsapp-grupo_1");
  });

  it("remove caracteres que não são seguros em URL", () => {
    expect(origemParam("Google Ads")).toBe("googleads");
    expect(origemParam("<script>alert(1)</script>")).toBe("scriptalert1script");
  });

  it("limita a 40 caracteres", () => {
    expect(origemParam("a".repeat(60))).toBe("a".repeat(40));
  });

  it("descarta valores inválidos", () => {
    expect(origemParam(null)).toBeNull();
    expect(origemParam(undefined)).toBeNull();
    expect(origemParam(42)).toBeNull();
    expect(origemParam("   ")).toBeNull();
  });

  it("lê origem da busca e prefere origem sobre utm_source", () => {
    expect(origemFromSearch({ origem: "instagram" })).toBe("instagram");
    expect(origemFromSearch({ utm_source: "whatsapp" })).toBe("whatsapp");
    expect(origemFromSearch({ origem: "facebook", utm_source: "google" })).toBe("facebook");
    expect(origemFromSearch({})).toBeNull();
  });
});

import { maskEmail } from "@/lib/checkout-logic";
describe("e-mail mascarado na página pública do pedido", () => {
  it("mostra só as duas primeiras letras e o domínio", () => {
    expect(maskEmail("joana.silva@gmail.com")).toBe("jo•••@gmail.com");
    expect(maskEmail("semarroba")).toBe("•••");
  });
});
