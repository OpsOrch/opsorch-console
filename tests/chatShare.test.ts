import assert from "node:assert";
import test from "node:test";
import {
  buildChatSharePath,
  buildChatShareTitle,
  buildProviderSharePayload,
} from "../app/lib/chatShare.js";

test("buildChatSharePath encodes the chat id", () => {
  assert.equal(buildChatSharePath("chat/alpha 1"), "/chats/chat%2Falpha%201");
});

test("buildChatShareTitle uses the first user turn", () => {
  const title = buildChatShareTitle([
    { role: "copilot", text: "I can help with that." },
    { role: "user", text: "Summarize the checkout-service incident and recent mitigations" },
  ]);

  assert.equal(title, "Summarize the checkout-service incident and recent mitigations");
});

test("buildProviderSharePayload includes a link and recent transcript", () => {
  const payload = buildProviderSharePayload({
    chatId: "chat-123",
    chatUrl: "https://console.example/chats/chat-123",
    turns: [
      { role: "user", text: "What changed in checkout-service?" },
      { role: "copilot", text: "The latest deploy increased error rate and rollback is in progress." },
    ],
  });

  assert.equal(payload.metadata.chatId, "chat-123");
  assert.match(payload.body, /OpsOrch Copilot: What changed in checkout-service\?/);
  assert.match(payload.body, /Question:\nWhat changed in checkout-service\?/);
  assert.match(payload.body, /Latest conclusion:\nThe latest deploy increased error rate and rollback is in progress\./);
  assert.match(payload.body, /Open chat: \[What changed in checkout-service\?\]\(https:\/\/console\.example\/chats\/chat-123\)/);
  assert.equal(payload.blocks[0]?.type, "header");
  assert.deepEqual(payload.blocks[2]?.fields, { "Chat ID": "chat-123", Turns: "2" });
  assert.equal(payload.blocks[4]?.text, "*Initial question*\nWhat changed in checkout-service?");
  assert.equal(payload.blocks[5]?.text, "*Latest conclusion*\nThe latest deploy increased error rate and rollback is in progress.");
});

test("buildProviderSharePayload uses the initial question and last copilot conclusion", () => {
  const payload = buildProviderSharePayload({
    chatId: "chat-456",
    chatUrl: "https://console.example/chats/chat-456",
    turns: [
      { role: "user", text: "Summarize the checkout incident" },
      { role: "copilot", text: "Initial summary" },
      { role: "user", text: "What about mitigation steps?" },
      { role: "copilot", text: "Mitigation summary\n- Rollback completed\n- Error rate normalized" },
    ],
  });

  assert.match(payload.body, /Question:\nSummarize the checkout incident/);
  assert.match(payload.body, /Latest conclusion:\nMitigation summary\n- Rollback completed\n- Error rate normalized/);
  assert.doesNotMatch(payload.body, /Initial summary/);
  assert.doesNotMatch(payload.body, /What about mitigation steps\?/);
  assert.equal(payload.blocks[4]?.text, "*Initial question*\nSummarize the checkout incident");
  assert.equal(payload.blocks[5]?.text, "*Latest conclusion*\nMitigation summary\n- Rollback completed\n- Error rate normalized");
  assert.equal(payload.blocks[0]?.type, "header");
});
