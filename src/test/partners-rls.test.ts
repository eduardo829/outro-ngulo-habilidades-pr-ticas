// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { overLimit, proposalSchema } from "@/lib/partners";

let db: PGlite;
const member = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid', true),'')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  CREATE TYPE app_role AS ENUM ('admin','member');
  CREATE FUNCTION public.has_role(_u uuid, _r app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;`);
  await db.exec(readFileSync("drizzle/migrations/0032_partners.sql", "utf8").replace(/-->\s*statement-breakpoint/g, ""));
  await db.exec(`INSERT INTO partner_proposals(name,email,interest,proposal) VALUES ('A','a@x.com','Procurar sócio','proposta de teste longa');`);
}, 30000);
afterAll(async () => { await db?.close(); });

describe("partner proposals access", () => {
  it("visitors cannot read proposals", async () => {
    await db.exec("SET ROLE anon");
    await expect(db.query("SELECT * FROM partner_proposals")).rejects.toThrow();
    await db.exec("RESET ROLE");
  });
  it("a regular member sees no proposals and cannot change status", async () => {
    await db.exec(`SET test.uid = '${member}'; SET ROLE authenticated`);
    expect((await db.query("SELECT * FROM partner_proposals")).rows).toHaveLength(0);
    await db.exec("UPDATE partner_proposals SET status='convertido'");
    await db.exec("RESET ROLE");
    expect((await db.query<{ status: string }>("SELECT status FROM partner_proposals")).rows[0]?.status).toBe("novo");
  });
  it("visitors see only the three published founding partners", async () => {
    await db.exec("SET ROLE anon");
    expect((await db.query("SELECT slug FROM partners")).rows).toHaveLength(3);
    await db.exec("RESET ROLE");
  });
});

describe("partner form rules", () => {
  const ok = { name: "Ana", email: "a@b.com", interest: "Procurar sócio", proposal: "x".repeat(20), consent: true };
  it("requires consent", () => expect(proposalSchema.safeParse({ ...ok, consent: false }).success).toBe(false));
  it("accepts a complete proposal", () => expect(proposalSchema.safeParse(ok).success).toBe(true));
  it("blocks the 4th proposal in an hour", () => { expect(overLimit(3, 0)).toBe(true); expect(overLimit(2, 2)).toBe(false); });
});
