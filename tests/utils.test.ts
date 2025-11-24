import assert from "node:assert";
import test from "node:test";
import { formatDate, stringify } from "../app/lib/utils.js";

test("formatDate returns dash for missing values", () => {
  assert.equal(formatDate(undefined), "-");
  assert.equal(formatDate(null), "-");
});

test("formatDate returns input for invalid dates and formatted date otherwise", () => {
  assert.equal(formatDate("not-a-date"), "not-a-date");
  const iso = "2024-01-02T03:04:05Z";
  assert.equal(formatDate(iso), new Date(iso).toLocaleString());
});

test("stringify pretty prints objects and skips empty ones", () => {
  assert.equal(stringify(undefined), null);
  assert.equal(stringify({}), null);
  assert.equal(stringify({ a: 1 }), JSON.stringify({ a: 1 }, null, 2));
});
