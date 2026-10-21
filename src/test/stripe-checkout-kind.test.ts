// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE TABLE purchases(id serial PRIMARY KEY, checkout_kind text,
    CONSTRAINT purchases_checkout_kind_check CHECK (checkout_kind IS NULL OR checkout_kind IN ('pro','brick')));`);
  await db.exec(readFileSync("drizzle/migrations/0025_stripe_checkout_kind.sql", "utf8"));
}, 30000);
afterAll(async () => {
  await db?.close();
});

describe("stripe checkout purchases", () => {
  it("a Stripe purchase row can be created", async () => {
    await db.query("INSERT INTO purchases(checkout_kind) VALUES('stripe')");
    expect((await db.query("SELECT count(*)::int AS n FROM purchases WHERE checkout_kind='stripe'")).rows[0]).toEqual({ n: 1 });
  });
  it("unknown checkout kinds are still rejected", async () => {
    await expect(db.query("INSERT INTO purchases(checkout_kind) VALUES('other')")).rejects.toThrow();
  });
});
