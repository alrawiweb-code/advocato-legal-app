"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  MessageSquare,
  ArrowLeft,
  ShieldOff,
  XCircle,
  Send,
  RefreshCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { SuspensionInquiry, InquiryMessage } from "@/lib/supabase/suspension-inquiry";

const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "text-amber-700 bg-amber-50 border-amber-200" },
  ADMIN_REPLIED: { label: "Admin Replied", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  LAWYER_REPLIED: { label: "Lawyer Replied", color: "text-blue-700 bg-blue-50 border-blue-200" },
  RESOLVED: { label: "Resolved", color: "text-slate-700 bg-slate-50 border-slate-200" },
  CLOSED: { label: "Closed", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

export default function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [inquiry, setInquiry] = useState<SuspensionInquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInquiry = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`);
      const data = await res.json();
      if (res.ok && data.inquiry) {
        setInquiry(data.inquiry);
        setMessages(data.inquiry.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        setError(data.error || "Failed to load inquiry");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiry();
  }, [id]);

  const sendMessage = async () => {
    if (!messageText.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setMessageText("");
      await loadInquiry();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (status: "OPEN" | "RESOLVED" | "CLOSED") => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadInquiry();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-on-surface-variant">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brass" />
        <span className="text-sm font-semibold">Loading inquiry details...</span>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-on-surface-variant">
        <AlertTriangle className="w-12 h-12 mb-3 text-rose-500 opacity-80" />
        <h3 className="font-headline font-semibold text-primary text-xl mb-1">Inquiry Not Found</h3>
        <p className="text-sm mb-4">{error}</p>
        <Link href="/admin/inquiries" className="text-brass hover:underline text-sm font-semibold">
          Return to Inquiries List
        </Link>
      </div>
    );
  }

  const isClosed = inquiry.status === "CLOSED" || inquiry.status === "RESOLVED";

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 py-6 pb-16">
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Inquiries</span>
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Messages */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest border border-hairline rounded-2xl overflow-hidden shadow-xs h-[700px]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                inquiry.inquiry_type === "SUSPENSION" ? "bg-orange-50 text-orange-700" : "bg-rose-50 text-rose-700"
              }`}>
                {inquiry.inquiry_type === "SUSPENSION" ? <ShieldOff className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline font-semibold text-primary">
                    {inquiry.lawyer_profile?.full_name}
                  </h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_META[inquiry.status]?.color || ""}`}>
                    {STATUS_META[inquiry.status]?.label || inquiry.status}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  {inquiry.inquiry_type === "SUSPENSION" ? "Suspension Inquiry" : "Rejection Inquiry"}
                </div>
              </div>
            </div>
            
            {!isClosed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStatus("RESOLVED")}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-surface/50">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-30" />
                <h3 className="font-headline font-semibold text-primary mb-1">No Messages Yet</h3>
                <p className="text-xs text-on-surface-variant">The lawyer hasn't sent a message.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender_role === "lawyer" && (
                    <img
                      src={msg.sender_profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_profile?.full_name || 'Lawyer')}`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-hairline mr-2 mt-1 object-cover shrink-0"
                    />
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender_role === "admin"
                        ? "bg-slate-dark text-white rounded-tr-sm"
                        : "bg-white border border-hairline text-primary rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {msg.sender_role === "lawyer" && (
                      <div className="font-bold text-xs text-primary mb-0.5">
                        {msg.sender_profile?.full_name}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <div className={`text-[10px] mt-1.5 ${msg.sender_role === "admin" ? "text-white/60" : "text-on-surface-variant"}`}>
                      {format(new Date(msg.created_at), "MMM d, HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-4 sm:p-5 border-t border-hairline bg-surface-container-lowest">
            {isClosed ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-surface-container-low border border-hairline rounded-xl text-sm text-on-surface-variant">
                <Lock className="w-4 h-4 shrink-0" />
                <span>This inquiry is closed.</span>
                <button
                  onClick={() => updateStatus("OPEN")}
                  className="ml-2 text-brass font-semibold hover:underline text-xs"
                >
                  Reopen
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your reply as Admin..."
                  className="flex-1 bg-surface border border-hairline rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-slate text-primary shadow-inner-xs"
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !messageText.trim()}
                  className="h-[74px] px-6 rounded-xl bg-slate-dark hover:bg-slate-900 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors font-semibold shadow-sm"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Context */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-surface-container-lowest border border-hairline rounded-2xl p-5 shadow-xs">
            <h3 className="font-headline font-semibold text-primary mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <ShieldOff className="w-4 h-4 text-slate" />
              <span>Suspension Context</span>
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-on-surface-variant text-xs font-semibold block mb-0.5">Lawyer</span>
                <Link href={`/admin/lawyers`} className="font-semibold text-primary hover:text-brass flex items-center gap-1">
                  {inquiry.lawyer_profile?.full_name}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-on-surface-variant text-xs">{inquiry.lawyer_profile?.email}</span>
              </div>
              
              <div>
                <span className="text-on-surface-variant text-xs font-semibold block mb-0.5">Suspension Date</span>
                <span className="text-primary">
                  {inquiry.suspended_at_snapshot ? format(new Date(inquiry.suspended_at_snapshot), "PPP p") : "Unknown"}
                </span>
              </div>
              
              <div>
                <span className="text-on-surface-variant text-xs font-semibold block mb-0.5">Reason Given</span>
                <div className="p-3 bg-surface-container-low rounded-lg border border-hairline text-primary text-xs leading-relaxed mt-1">
                  {inquiry.suspension_reason_snapshot || "No reason provided."}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t border-hairline">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                <strong className="block mb-1">Important Note:</strong>
                Resolving this inquiry does <strong>not</strong> automatically reactivate the lawyer's marketplace access. To reactivate them, use the Reactivate button on their profile in the Lawyer Directory.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
