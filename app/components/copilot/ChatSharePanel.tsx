"use client";

import { useMemo, useState } from "react";
import { requestJSON } from "@/app/lib/api";
import { useAsyncState } from "@/app/lib/hooks";
import { Pill } from "@/app/lib/ui";
import {
  buildChatSharePath,
  buildChatShareTitle,
  buildProviderSharePayload,
  type ShareableChatTurn,
} from "@/app/lib/chatShare";

type ChatSharePanelProps = {
  chatId: string;
  turns: ShareableChatTurn[];
};

export function ChatSharePanel({ chatId, turns }: ChatSharePanelProps) {
  const [shareChannel, setShareChannel] = useState("#ops");
  const [linkStatus, setLinkStatus] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const shareState = useAsyncState();

  const shareTitle = useMemo(() => buildChatShareTitle(turns), [turns]);

  const getChatUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${buildChatSharePath(chatId)}`;
  };

  const copyShareLink = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard is not available in this browser");
      }
      await navigator.clipboard.writeText(getChatUrl());
      setLinkStatus("Link copied");
    } catch (err) {
      setLinkStatus(err instanceof Error ? err.message : "Failed to copy link");
    }
  };

  const shareChatLink = async () => {
    const chatUrl = getChatUrl();
    if (!chatUrl) return;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: "Open this OpsOrch Copilot chat",
          url: chatUrl,
        });
        setLinkStatus("Share sheet opened");
        return;
      } catch (err) {
        const errorName = err instanceof Error ? err.name : "";
        if (errorName === "AbortError") {
          setLinkStatus("");
          return;
        }
      }
    }

    await copyShareLink();
  };

  const sendSharedChat = async () => {
    if (!shareChannel.trim()) return;

    shareState.start();
    try {
      const payload = buildProviderSharePayload({
        chatId,
        chatUrl: getChatUrl(),
        turns,
      });
      await requestJSON("/messages/send", {
        method: "POST",
        body: JSON.stringify({
          channel: shareChannel.trim(),
          ...payload,
        }),
      });
      shareState.succeed();
      setShareNotice(`Sent to ${shareChannel.trim()}`);
      setShowProviderForm(false);
    } catch (err) {
      shareState.fail(err);
      setShareNotice("");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
      >
        Share
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-11 z-20 flex w-72 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Share chat</p>
              <p className="truncate text-[11px] text-slate-500">{shareTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowProviderForm(false);
              }}
              className="text-xs text-slate-400 transition hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={shareChatLink}
              className="text-slate-600 transition hover:text-slate-900"
            >
              Share link
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={copyShareLink}
              className="text-slate-600 transition hover:text-slate-900"
            >
              Copy link
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => setShowProviderForm((open) => !open)}
              className="text-slate-600 transition hover:text-slate-900"
            >
              Send message
            </button>
          </div>

          {showProviderForm ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
              <input
                type="text"
                value={shareChannel}
                onChange={(e) => setShareChannel(e.target.value)}
                placeholder="#ops"
                className="h-8 min-w-[8rem] flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:border-[#55cfd0] focus:outline-none focus:ring-2 focus:ring-[#55cfd0]/20"
              />
              <button
                type="button"
                onClick={sendSharedChat}
                disabled={shareState.loading || !shareChannel.trim()}
                className="rounded-md bg-[#55cfd0] px-3 py-1.5 text-[11px] font-semibold text-[#0b1517] transition hover:bg-[#3fb8b8] disabled:cursor-not-allowed disabled:bg-[#b7eded]"
              >
                {shareState.loading ? "Sending..." : "Send"}
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {linkStatus ? <Pill label={linkStatus} /> : null}
            {shareNotice ? <Pill label={shareNotice} tone="success" /> : null}
            {shareState.error ? <Pill label={shareState.error} tone="error" /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
