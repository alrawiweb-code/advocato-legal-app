"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Scale, Clock } from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { INDIAN_STATES } from "@/lib/data/lawyers";
import {
  getVerificationRequirements,
  submitVerificationApplication,
  getLawyerApplication,
  VerificationRequirement,
  LawyerApplicationRecord,
} from "@/lib/supabase/verification";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const { currentUser, activeLawyer, refreshUser } = useUserRole();

  const [requirements, setRequirements] = useState<VerificationRequirement[]>([]);
  const [existingApp, setExistingApp] = useState<LawyerApplicationRecord | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const [barNumber, setBarNumber] = useState(
    currentUser.barNumber || activeLawyer?.jurisdiction ? `${activeLawyer?.jurisdiction?.slice(0, 2).toUpperCase()}/1234/${new Date().getFullYear()}` : ""
  );
  const [stateBar, setStateBar] = useState(
    activeLawyer?.state || currentUser.jurisdiction || "Delhi (DL)"
  );
  const [yearsExperience, setYearsExperience] = useState(activeLawyer?.yearsExperience || 5);

  const [selectedFiles, setSelectedFiles] = useState<{ [requirementId: string]: File }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoadingInitial(true);
      setErrorMsg(null);
      try {
        const [reqs, app] = await Promise.all([
          getVerificationRequirements(),
          currentUser.id ? getLawyerApplication(currentUser.id) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setRequirements(reqs);
          setExistingApp(app);
          if (app?.bar_number) setBarNumber(app.bar_number);
          if (app?.state_bar) setStateBar(app.state_bar);
          if (app?.years_experience) setYearsExperience(app.years_experience);
        }
      } catch (err) {
        console.error("Error loading verification requirements:", err);
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser.id, activeLawyer]);

  if (!isOpen) return null;

  const handleFileChange = (requirementId: string, file: File | null) => {
    if (!file) {
      const copy = { ...selectedFiles };
      delete copy[requirementId];
      setSelectedFiles(copy);
      return;
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File size must be under 15MB");
      return;
    }

    setSelectedFiles((prev) => ({
      ...prev,
      [requirementId]: file,
    }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!barNumber.trim()) {
      setErrorMsg("Bar enrollment number is required.");
      return;
    }

    // Check required documents
    const requiredReqs = requirements.filter((r) => r.is_required);
    for (const req of requiredReqs) {
      if (!selectedFiles[req.id]) {
        // If there's an existing document in existingApp with this requirementId, allow it
        const hasExistingDoc = existingApp?.documents?.some((d) => d.document_requirement_id === req.id);
        if (!hasExistingDoc) {
          setErrorMsg(`Please attach your ${req.name}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const documentsPayload = Object.entries(selectedFiles).map(([requirementId, file]) => ({
        requirementId,
        file,
      }));

      const res = await submitVerificationApplication({
        lawyerId: currentUser.id,
        barNumber: barNumber.trim(),
        stateBar,
        yearsExperience: Number(yearsExperience) || 1,
        documents: documentsPayload,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Submission failed. Please try again.");
        return;
      }

      setSubmittedSuccess(true);
      await refreshUser();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPendingReview = existingApp?.status === "PENDING" || existingApp?.status === "SUBMITTED" || existingApp?.status === "UNDER_REVIEW";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-hairline rounded-2xl shadow-editorial w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-bold text-primary">
                Advocato Bar Admissions &amp; Verification
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Credential verification required to unlock client case dockets &amp; intake matters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
          {isLoadingInitial ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Loading verification criteria...</p>
            </div>
          ) : submittedSuccess || isPendingReview ? (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-600">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Application Under Review
                </span>
                <h3 className="font-headline text-2xl font-bold text-primary">
                  Dossier Submitted to Admissions Desk
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Thank you, Counsel. Your Bar Council credentials and enrollment verification documents have been received by our regulatory compliance desk.
                </p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-hairline text-left text-xs space-y-2">
                <div className="flex justify-between pb-1.5 border-b border-hairline">
                  <span className="text-on-surface-variant">State Bar Council:</span>
                  <span className="font-semibold text-primary">{existingApp?.state_bar || stateBar}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-hairline">
                  <span className="text-on-surface-variant">Bar Enrollment No:</span>
                  <span className="font-semibold text-primary">{existingApp?.bar_number || barNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Estimated Review Time:</span>
                  <span className="font-semibold text-brass">12 – 24 Business Hours</span>
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant italic">
                You will receive full case docket access and marketplace client matching upon approval.
              </p>

              <button
                onClick={onClose}
                className="w-full bg-primary text-white text-xs font-semibold py-3 px-6 rounded-lg hover:bg-primary-container transition-all"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Bar Credentials Section */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                  1. State Bar Admissions Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      State Bar Council <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={stateBar}
                      onChange={(e) => setStateBar(e.target.value)}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs text-primary focus:border-slate focus:outline-none"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Bar Registration Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. D/4921/2014"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs text-primary focus:border-slate focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Years of Active Practice
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs text-primary focus:border-slate focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Required Documents Section */}
              <div className="border-t border-hairline pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    2. Upload Verification Documents
                  </h4>
                  <span className="text-[11px] text-on-surface-variant">PDF, PNG, or JPG (Max 15MB each)</span>
                </div>

                <div className="space-y-4">
                  {requirements.map((req) => {
                    const selectedFile = selectedFiles[req.id];
                    return (
                      <div
                        key={req.id}
                        className="p-4 bg-surface-container-low/40 rounded-xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brass shrink-0" />
                            <span className="font-semibold text-xs text-primary">
                              {req.name} {req.is_required && <span className="text-rose-500">*</span>}
                            </span>
                          </div>
                          {req.description && (
                            <p className="text-[11px] text-on-surface-variant pl-6">{req.description}</p>
                          )}
                        </div>

                        <div className="sm:shrink-0 pl-6 sm:pl-0">
                          {selectedFile ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-700 font-medium truncate max-w-[180px]">
                                {selectedFile.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleFileChange(req.id, null)}
                                className="text-[11px] text-rose-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer inline-flex items-center gap-2 bg-surface hover:bg-surface-container-low border border-hairline text-primary text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-brass" />
                              <span>Select Document</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleFileChange(req.id, file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Privilege Statement */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-hairline text-[11px] text-on-surface-variant flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brass shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Advocato adheres to statutory bar admission standards and advocates' professional etiquette rules. All uploaded identity credentials are encrypted and accessed solely by the Bar Verification Panel for admission auditing.
                </p>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg border border-hairline text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brass hover:bg-brass-hover disabled:opacity-50 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-xs hover:shadow-md btn-editorial-brass flex items-center gap-2 min-h-[42px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Encrypting &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Application for Approval</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
