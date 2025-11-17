import { useState } from "react";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { MessageResult } from "@/app/lib/types";
import { formatDate } from "@/app/lib/utils";
import { Field, Pill, Section, TextArea, TextInput } from "@/app/lib/ui";

export function MessagingPanel() {
  const messageState = useAsyncState();
  const [messageForm, setMessageForm] = useState({
    channel: "#ops",
    body: "Hello from OpsOrch",
  });
  const [messageResult, setMessageResult] = useState<MessageResult | null>(null);

  const sendMessage = async () => {
    messageState.start();
    try {
      const payload: Record<string, unknown> = {
        channel: messageForm.channel,
        body: messageForm.body,
      };

      const res = await requestJSON<MessageResult>("/messages/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessageResult(res);
      messageState.succeed();
    } catch (err) {
      messageState.fail(err);
    }
  };

  return (
    <Section
      title="Messaging"
      description="Send a message into the configured channel."
    >
      <Field
        label="Channel"
        input={
          <TextInput
            value={messageForm.channel}
            onChange={(v) => setMessageForm((f) => ({ ...f, channel: v }))}
            placeholder="#ops"
          />
        }
      />
      <Field
        label="Message"
        input={
          <TextArea
            value={messageForm.body}
            onChange={(v) => setMessageForm((f) => ({ ...f, body: v }))}
            placeholder="Deployment finished"
          />
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sendMessage}
          className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8]"
        >
          {messageState.loading ? "Sending..." : "Send message"}
        </button>
        {messageState.error ? <Pill label={messageState.error} tone="error" /> : null}
      </div>
      {messageResult ? (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last send</p>
          <p className="font-semibold text-slate-900">{messageResult.channel}</p>
          <p className="mt-1 text-xs text-slate-500">Sent at {formatDate(messageResult.sentAt)}</p>
        </div>
      ) : null}
    </Section>
  );
}
