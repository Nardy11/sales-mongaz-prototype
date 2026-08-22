import assert from "node:assert/strict";
import test from "node:test";
import { deriveCommitmentAttention } from "../src/customer-commitment";

test("commitment attention derives overdue without adding a manual lifecycle state", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");
  assert.equal(deriveCommitmentAttention("open", "2026-08-22T11:59:59.000Z", now), "overdue");
  assert.equal(deriveCommitmentAttention("open", "2026-08-22T12:00:01.000Z", now), "open");
  assert.equal(deriveCommitmentAttention("completed", "2026-08-21T00:00:00.000Z", now), "completed");
  assert.equal(deriveCommitmentAttention("cancelled", "2026-08-21T00:00:00.000Z", now), "cancelled");
});
