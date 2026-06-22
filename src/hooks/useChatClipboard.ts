"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/chat";

async function writeClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Clipboard unavailable");
}

export function useChatClipboard() {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const copyNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(
    () => () => {
      if (copyNoticeTimeoutRef.current) {
        clearTimeout(copyNoticeTimeoutRef.current);
      }
    },
    [],
  );

  function setTimedCopyNotice(messageId: string | null, notice: string) {
    setCopiedMessageId(messageId);
    setCopyNotice(notice);
    if (copyNoticeTimeoutRef.current) {
      clearTimeout(copyNoticeTimeoutRef.current);
    }
    copyNoticeTimeoutRef.current = setTimeout(() => {
      setCopiedMessageId(null);
      setCopyNotice(null);
    }, 2200);
  }

  async function copyMessage(message: Message) {
    const value = message.content.trim();
    if (!value) return;
    try {
      await writeClipboard(value);
      setTimedCopyNotice(message.id, "Message copied.");
    } catch {
      setTimedCopyNotice(null, "Copy failed. Select the message text manually.");
    }
  }

  return {
    copiedMessageId,
    copyMessage,
    copyNotice,
  };
}
