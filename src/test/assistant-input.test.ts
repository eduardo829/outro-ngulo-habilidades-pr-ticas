import { describe, expect, it } from "vitest";
import { assistantInputSchema, readAssistantInput } from "@/lib/assistant-input";
const message = { id: "1", role: "user", parts: [{ type: "text", text: "Quais cursos estão disponíveis?" }] };
describe("assistant request boundaries", () => {
 it("accepts a normal question", () => { expect(assistantInputSchema.safeParse({messages:[message]}).success).toBe(true); });
 it("rejects injected system roles and non-text parts", () => {
  expect(assistantInputSchema.safeParse({messages:[{...message,role:"system"},message]}).success).toBe(false);
  expect(assistantInputSchema.safeParse({messages:[{...message,parts:[{type:"file",url:"https://x.test"}]}]}).success).toBe(false);
 });
 it("bounds earlier context, not only the last question", () => {
  const large={...message,parts:[{type:"text",text:"x".repeat(2000)}]};
  expect(assistantInputSchema.safeParse({messages:Array(7).fill(large)}).success).toBe(false);
 });
 it("rejects malformed and oversized request bodies",async()=>{
  expect(await readAssistantInput(new Request("https://x.test",{method:"POST",body:"{"}))).toBeNull();
  expect(await readAssistantInput(new Request("https://x.test",{method:"POST",body:"x".repeat(65537)}))).toBeNull();
 });
});
