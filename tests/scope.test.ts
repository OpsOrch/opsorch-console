import assert from "node:assert";
import test from "node:test";
import { parseScope, serializeScope, mergeScopes } from "../app/lib/scope.ts";

test("parseScope returns undefined for null/undefined/empty", () => {
  assert.strictEqual(parseScope(null), undefined);
  assert.strictEqual(parseScope(undefined), undefined);
  assert.strictEqual(parseScope(""), undefined);
});

test("parseScope parses valid JSON string", () => {
  const input = JSON.stringify({ service: "foo" });
  assert.deepStrictEqual(parseScope(input), { service: "foo" });
});

test("parseScope returns undefined for invalid JSON string", () => {
  assert.strictEqual(parseScope("{invalid"), undefined);
});

test("parseScope returns object if passed as object", () => {
  const input = { service: "foo" };
  assert.deepStrictEqual(parseScope(input), input);
});

test("parseScope returns undefined for object with no known keys", () => {
  assert.strictEqual(parseScope({ foo: "bar" }), undefined);
});

test("parseScope returns object if at least one key is known", () => {
  assert.deepStrictEqual(parseScope({ service: "foo", other: "bar" }), { service: "foo", other: "bar" });
});

test("serializeScope returns empty string for undefined", () => {
  assert.strictEqual(serializeScope(undefined), "");
});

test("serializeScope serializes object", () => {
  assert.strictEqual(serializeScope({ service: "foo" }), '{"service":"foo"}');
});

test("mergeScopes merges multiple scopes", () => {
  const s1 = { service: "foo" };
  const s2 = { environment: "prod" };
  assert.deepStrictEqual(mergeScopes(s1, s2), { service: "foo", environment: "prod" });
});

test("mergeScopes overrides values from later scopes", () => {
  const s1 = { service: "foo" };
  const s2 = { service: "bar" };
  assert.deepStrictEqual(mergeScopes(s1, s2), { service: "bar" });
});

test("mergeScopes handles undefined inputs", () => {
  const s1 = { service: "foo" };
  assert.deepStrictEqual(mergeScopes(s1, undefined), { service: "foo" });
  assert.deepStrictEqual(mergeScopes(undefined, s1), { service: "foo" });
});
