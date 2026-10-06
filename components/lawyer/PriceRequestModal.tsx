"use client";

import React, { useState, useEffect } from "react";
import { X, IndianRupee, Loader2, ArrowRight, ShieldAlert } from "lucide-react";

export function PriceRequestModal({
  isOpen,
  onClose,
  currentRate,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentRate: number;
}) {
  const [requestedRate, setRequestedRate] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkExistingRequest();
    }
  }, [isOpen]);

  const checkExistingRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/lawyer/price-request");
      if (res.ok) {
        const data = await res.json();
        const pending = data.requests?.find((r: any) => r.status === "PENDING");
        if (pending) {
          setExistingRequest(pending);
        } else {
          setExistingRequest(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedRate || Number(requestedRate) <= 0) {
      setError("Please enter a valid rate.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the rate change.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/lawyer/price-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedRate: Number(requestedRate),
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request.");
      }

      await checkExistingRequest();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-lowest rounded-2xl shadow-editorial w-full max-w-lg border border-hairline overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <h2 className="font-headline text-lg font-semibold text-primary">Request Rate Change</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-brass animate-spin" />
            </div>
          ) : existingRequest ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-primary text-lg mb-2">Request Pending Review</h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                You have already submitted a request to change your rate from{" "}
                <strong>₹{existingRequest.current_rate?.toLocaleString("en-IN") || currentRate.toLocaleString("en-IN")}/hr</strong> to{" "}
                <strong>₹{existingRequest.requested_rate.toLocaleString("en-IN")}/hr</strong>.
              </p>
              <div className="bg-surface-container-low border border-hairline rounded-lg p-4 text-left text-xs text-on-surface-variant italic">
                "{existingRequest.reason}"
              </div>
              <p className="text-xs text-outline mt-6">
                The Admissions Desk will review your request shortly. You will be notified of the decision.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-hairline">
                <div>
                  <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">Current Official Rate</p>
                  <p className="text-xl font-bold text-primary">₹{currentRate.toLocaleString("en-IN")}/hr</p>
                </div>
                <ArrowRight className="w-5 h-5 text-outline" />
                <div className="text-right">
                  <p className="text-xs font-semibold text-brass uppercase tracking-wider mb-1">Requested Rate</p>
                  <div className="relative inline-block">
                    <span className="absolute left-3 top-2.5 text-sm font-medium text-on-surface-variant">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 3500"
                      value={requestedRate}
                      onChange={(e) => setRequestedRate(Number(e.target.value) || "")}
                      className="w-32 bg-white border border-brass/50 rounded-lg pl-7 pr-3 py-2 text-primary font-bold focus:outline-none focus:border-brass shadow-2xs text-right"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-2">
                  Reason for Rate Increase
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Increased years of experience, specialized certification acquired, market rate adjustments..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface-container border border-hairline rounded-lg p-3 text-sm text-primary focus:outline-none focus:border-brass resize-none"
                />
                <p className="text-[11px] text-on-surface-variant mt-2">
                  This justification will be reviewed by the Admissions Desk before your new rate is authorized.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-slate-dark text-white py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
                  Submit Request for Approval
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
