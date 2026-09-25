"use client";

import React, { useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  RefreshCw,
  ShieldOff,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { SuspensionInquiry, InquiryMessage } from "@/lib/supabase/suspension-inquiry";

interface SuspensionInquiryPanelProps {
  verificationStatus: string;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open — Awaiting Admin Response", color: "text-amber-700 bg-amber-50 border-amber-200" },
  ADMIN_REPLIED: { label: "Admin Replied — Review Response", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  LAWYER_REPLIED: { label: "Your Reply Sent — Awaiting Admin", color: "text-blue-700 bg-blue-50 border-blue-200" },
  RESOLVED: { label: "Resolved", color: "text-slate-700 bg-slate-50 border-slate-200" },
  CLOSED: { label: "Closed", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

export function SuspensionInquiryPanel({
  verificationStatus,
  suspensionReason,
  suspendedAt,
}: SuspensionInquiryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inquiry, setInquiry] = useState<SuspensionInquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSuspended = verificationStatus === "SUSPENDED";
  const isRejected = verificationStatus === "REJECTED";

  if (!isSuspended && !isRejected) return null;

  const openInquiry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lawyer/inquiry", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open inquiry");
      setInquiry(data.inquiry);
      await loadMessages(data.inquiry.id);
      setIsExpanded(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (inquiryId: string) => {
    try {
      const res = await fetch(`/api/lawyer/inquiry/${inquiryId}/messages`);
      const data = await res.json();
      if (res.ok && data.inquiry) {
        setInquiry(data.inquiry);
        setMessages(data.inquiry.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!inquiry || !messageText.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/lawyer/inquiry/${inquiry.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setMessageText("");
      await loadMessages(inquiry.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const isClosed = inquiry?.status === "CLOSED" || inquiry?.status === "RESOLVED";

  const bannerColor = isSuspended
    ? "bg-orange-500/10 border-orange-500/30"
    : "bg-rose-500/10 border-rose-500/30";
  const iconColor = isSuspended ? "text-orange-700" : "text-rose-700";
  const iconBg = isSuspended ? "bg-orange-500/20" : "bg-rose-500/20";
  const IconComp = isSuspended ? ShieldOff : XCircle;

  return (
    <div className={`${bannerColor} border rounded-2xl overflow-hidden mb-8`}>
      {/* Header — always visible */}
      <button
        onClick={() => {
          if (!inquiry) {
            openInquiry();
          } else {
            setIsExpanded((v) => !v);
            if (!isExpanded) loadMessages(inquiry.id);
          }
        }}
        className="w-full p-5 flex items-center justify-between gap-4 text-left"
        disabled={isLoading}
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}>
            <IconComp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-headline font-semibold text-primary text-sm sm:text-base">
                {isSuspended ? "Ask About Your Suspension" : "Appeal Your Rejection"}
              </h3>
              {inquiry && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_META[inquiry.status]?.color || ""}`}>
                  {STATUS_META[inquiry.status]?.label || inquiry.status}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isSuspended
                ? "Open a direct inquiry to the Admin team to ask about your suspension."
                : "Send a message to the Admin team regarding your rejected verification application."}
            </p>
          </div>
        </div>
        <div className={`shrink-0 ${iconColor}`}>
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && inquiry && (
        <div className="border-t border-hairline">
          {/* Context card */}
          <div className="px-5 py-4 bg-surface-container-lowest/60 border-b border-hairline">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-semibold block mb-0.5">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border text-[11px] ${
                  isSuspended ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {verificationStatus}
                </span>
              </div>
              {suspendedAt && (
                <div>
                  <span className="text-on-surface-variant font-semibold block mb-0.5">
                    {isSuspended ? "Suspended On" : "Rejected On"}
                  </span>
                  <span className="text-primary font-mono">
                    {format(new Date(suspendedAt), "dd MMM yyyy")}
                  </span>
                </div>
              )}
              {suspensionReason && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-on-surface-variant font-semibold block mb-0.5">Admin Reason</span>
                  <span className="text-primary leading-relaxed">{suspensionReason}</span>
                </div>
              )}
              <div>
                <span className="text-on-surface-variant font-semibold block mb-0.5">Inquiry ID</span>
                <span className="font-mono text-[10px] text-on-surface-variant">{inquiry.id.slice(0, 8)}...</span>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold block mb-0.5">Opened</span>
                <span className="text-primary font-mono">
                  {format(new Date(inquiry.created_at), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            </div>
          </div>

          {/* Message thread */}
          <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="w-8 h-8 text-on-surface-variant mx-auto mb-2 opacity-30" />
                <p className="text-xs text-on-surface-variant">
                  No messages yet. Send your first message to the Admin team below.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === "lawyer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.sender_role === "lawyer"
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-surface-container-low border border-hairline text-primary rounded-bl-none"
                    }`}
                  >
                    {msg.sender_role === "admin" && (
                      <div className="font-bold text-[10px] text-brass mb-0.5 uppercase tracking-wide">
                        Admin Response
                      </div>
                    )}
                    <p>{msg.message}</p>
                    <div className={`text-[10px] mt-1 ${msg.sender_role === "lawyer" ? "text-white/60" : "text-on-surface-variant"}`}>
                      {format(new Date(msg.created_at), "dd MMM, HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Compose */}
          {isClosed ? (
            <div className="px-5 pb-5 pt-2">
              <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-hairline rounded-xl text-xs text-on-surface-variant">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  This inquiry has been{" "}
                  <strong>{inquiry.status === "RESOLVED" ? "resolved" : "closed"}</strong> by the
                  Admin team. Please contact Advocato support if you have further questions.
                </span>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-5 pt-2 flex items-end gap-3">
              <textarea
                rows={2}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message to the Admin team…"
                className="flex-1 bg-surface border border-hairline rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-slate text-primary"
              />
              <button
                onClick={sendMessage}
                disabled={isSending || !messageText.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 shrink-0"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
