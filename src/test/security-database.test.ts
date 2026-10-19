import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const purchase="11111111-1111-4111-8111-111111111111",attempt="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",oldAttempt="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE TABLE messages(id integer,body text,read_at timestamptz); GRANT UPDATE ON messages TO authenticated;
 CREATE TABLE purchases(id uuid PRIMARY KEY,user_id uuid,course_id uuid,payment_provider text,payment_status text,transaction_id text,provider_status text,checkout_kind text,attempt_id uuid,attempt_state text,updated_at timestamptz);
 CREATE TABLE enrollments(user_id uuid,course_id uuid,status text,source text,purchase_id uuid,UNIQUE(user_id,course_id));
 CREATE TABLE ai_settings(id int PRIMARY KEY,session_minutes int,visitor_daily_messages int,member_daily_messages int,ip_daily_messages int,per_minute_limit int,daily_spend_limit_cents int,est_cost_cents_per_message numeric);
 INSERT INTO ai_settings VALUES(1,10,4,15,40,5,1,1);
 CREATE TABLE ai_usage(subject text,day date,messages int DEFAULT 0,first_at timestamptz,minute_start timestamptz,minute_count int DEFAULT 0,PRIMARY KEY(subject,day));
 CREATE TABLE ai_spend(day date,feature text,requests int,est_cost_cents numeric,PRIMARY KEY(day,feature));`);
 await db.exec(readFileSync("drizzle/migrations/0022_security_concurrency_and_message_permissions.sql","utf8"));
},30000);
afterAll(async()=>{await db?.close();});
async function resetPurchase(state="pending",attemptState="in_flight"){
 await db.exec("DELETE FROM enrollments; DELETE FROM purchases;");
 await db.query(`INSERT INTO purchases(id,user_id,course_id,payment_provider,payment_status,transaction_id,checkout_kind,attempt_id,attempt_state) VALUES($1,$2,$3,'mercadopago',$4,'old-payment','brick',$5,$6)`,[purchase,"22222222-2222-4222-8222-222222222222","33333333-3333-4333-8333-333333333333",state,attempt,attemptState]);
}
async function apply(status:string,tx:string,binding:string|null){return db.query("SELECT checkout_apply_verified_payment($1,$2,$3,$4,$5) AS status",[purchase,status,tx,status,binding]);}
describe("security database regressions",()=>{
 it("recipient can mark read but cannot edit message contents",async()=>{
  const {rows}=await db.query(`SELECT has_column_privilege('authenticated','messages','body','UPDATE') AS body,has_column_privilege('authenticated','messages','read_at','UPDATE') AS read`);
  expect(rows[0]).toEqual({body:false,read:true});
 });
 it("an old rejection cannot unlock a new in-flight attempt",async()=>{
  await resetPurchase();await apply("failed","old-payment",oldAttempt);
  expect((await db.query("SELECT attempt_state,attempt_id FROM purchases")).rows[0]).toEqual({attempt_state:"in_flight",attempt_id:attempt});
 });
 it("legacy reconciliation cannot unlock a new in-flight attempt",async()=>{
  await resetPurchase();await db.query("SELECT checkout_apply_payment($1,'failed','old-payment','rejected')",[purchase]);
  expect((await db.query("SELECT attempt_state FROM purchases")).rows[0]).toEqual({attempt_state:"in_flight"});
 });
 it("current rejection allows retry",async()=>{
  await resetPurchase();await apply("failed","current-payment",attempt);
  expect((await db.query("SELECT attempt_state FROM purchases")).rows[0]).toEqual({attempt_state:"rejected"});
 });
 it("stale approval cannot restore refunded access",async()=>{
  await resetPurchase("paid","done");await apply("refunded","current-payment",attempt);await apply("paid","current-payment",attempt);
  expect((await db.query("SELECT payment_status FROM purchases")).rows[0]).toEqual({payment_status:"refunded"});
  expect((await db.query("SELECT count(*)::int AS active FROM enrollments WHERE status='active'")).rows[0]).toEqual({active:0});
 });
 it("budget allows one reservation across different visitors",async()=>{
  const results=await Promise.all(Array.from({length:6},(_,i)=>db.query<{quota:{allowed:boolean}}>("SELECT ai_consume(NULL,$1,'assistant',true) AS quota",["security-test-ip-"+i])));
  expect(results.filter(r=>r.rows[0]?.quota.allowed)).toHaveLength(1);
  expect((await db.query("SELECT sum(est_cost_cents)::int AS spent FROM ai_spend")).rows[0]).toEqual({spent:1});
 });
 it("next reservation cannot exceed the remaining budget",async()=>{
  await db.exec("UPDATE ai_settings SET daily_spend_limit_cents=2,est_cost_cents_per_message=2;");
  const {rows}=await db.query<{quota:{allowed:boolean;reason:string}}>("SELECT ai_consume(NULL,'security-test-last-ip','assistant',true) AS quota");
  expect(rows[0]?.quota).toMatchObject({allowed:false,reason:"budget"});
 });
});
