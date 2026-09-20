"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  ArrowRight,
  UploadCloud,
  FileText,
  Trash2,
  Lock,
  Scale,
  CheckCircle2,
} from "lucide-react";
import { getAllLawyers, INDIAN_STATES } from "@/lib/data/lawyers";
import { uploadEvidentiaryDocument } from "@/lib/storage/documents";
import { saveIntakeAssessment } from "@/lib/supabase/matters";

interface UploadedFileItem {
  id: string;
  name: string;
  size: string;
  category: string;
  sha256Hash?: string;
  previewUrl?: string;
}

const COMMON_TOPICS = [
  { title: "Severance Agreement Review", category: "Employment & Labor Law" },
  { title: "Wrongful Termination Claim", category: "Employment & Labor Law" },
  { title: "Non-Compete Dispute", category: "Employment & Labor Law" },
  { title: "SaaS & Commercial Contract Breach", category: "Corporate & Commercial Law" },
  { title: "Trademark & Brand Protection", category: "Intellectual Property" },
];

const ANALYSIS_STAGES = [
  "Structuring confidential factual timeline...",
  "Running jurisdiction-specific legal precedent analysis...",
  "Analyzing provided contract documents & exhibits...",
  "Matching verified counsel licensed in your state...",
];

export default function IntakePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [caseTitle, setCaseTitle] = useState("");
  const [category, setCategory] = useState("Employment & Labor Law");
  const [jurisdiction, setJurisdiction] = useState("Delhi (DL)");
  const [opposingParty, setOpposingParty] = useState("");
  const [situation, setSituation] = useState("");
  const [documents, setDocuments] = useState<UploadedFileItem[]>([]);
  const rawFilesRef = useRef<Map<string, File>>(new Map());

  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const baseSituationRef = useRef<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // File Upload Handlers
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: UploadedFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `doc-${Date.now()}-${i}`;
      rawFilesRef.current.set(docId, file);

      const sizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      let docCategory = "General Document";
      const lower = file.name.toLowerCase();
      if (lower.includes("severance") || lower.includes("contract") || lower.includes("agreement")) {
        docCategory = "Contract / Agreement";
      } else if (lower.includes("termination") || lower.includes("notice") || lower.includes("letter")) {
        docCategory = "Formal Notice";
      } else if (lower.includes("email") || lower.includes("chat") || lower.includes("message")) {
        docCategory = "Correspondence";
      }

      newDocs.push({
        id: docId,
        name: file.name,
        size: sizeFormatted,
        category: docCategory,
      });
    }

    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const removeDocument = (id: string) => {
    rawFilesRef.current.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Voice recording & Continuous Speech-to-Text
  const stopVoiceRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech-to-text dictation is not supported in this browser. Please type your situation in the text box.");
      return;
    }

    try {
      // Abort any lingering recognition instance before starting fresh
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // Snapshot any existing typed text before starting dictation
      baseSituationRef.current = situation.trim();
      isRecordingRef.current = true;
      setIsRecording(true);

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        // Reconstruct the transcript across all results without duplicating
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript + " ";
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        const base = baseSituationRef.current;
        const spoken = (finalTranscript + interimTranscript).trim();

        if (base && spoken) {
          setSituation(`${base} ${spoken}`);
        } else if (spoken) {
          setSituation(spoken);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event?.error);
        // Ignore "no-speech" pauses so mic doesn't auto turn off while user is thinking
        if (event?.error === "no-speech") {
          return;
        }
        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          isRecordingRef.current = false;
          setIsRecording(false);
          alert("Microphone permission was denied. Please allow microphone access in your browser to dictate your story.");
          return;
        }
      };

      recognition.onend = () => {
        // If user didn't click stop, auto-restart so the mic stays listening continuously
        if (isRecordingRef.current) {
          setSituation((currentSituation) => {
            baseSituationRef.current = currentSituation.trim();
            return currentSituation;
          });
          try {
            recognition.start();
          } catch (e) {
            // Already started or restart prevented
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const applyTopic = (topic: (typeof COMMON_TOPICS)[0]) => {
    setCaseTitle(topic.title);
    setCategory(topic.category);
  };

  const handleContinue = async (skip: boolean = false) => {
    stopVoiceRecording();
    if (skip) {
      // Direct user to lawyers directory without saving fake dummy case data
      router.push("/lawyers");
      return;
    }

    if (!situation.trim()) {
      return;
    }

    const finalSituation = situation.trim();

    setIsAnalyzing(true);
    setAnalysisStage(0);

    const interval = setInterval(() => {
      setAnalysisStage((prev) => (prev < ANALYSIS_STAGES.length - 1 ? prev + 1 : prev));
    }, 850);

    try {
      const currentLawyers = getAllLawyers();
      const intakeMatterId = `matter-intake-${Date.now()}`;

      // Upload raw files to Supabase Storage if available
      const processedDocuments = await Promise.all(
        documents.map(async (doc) => {
          const rawFile = rawFilesRef.current.get(doc.id);
          if (rawFile) {
            try {
              const res = await uploadEvidentiaryDocument(rawFile, intakeMatterId, doc.category);
              return {
                name: doc.name,
                size: doc.size,
                category: doc.category,
                storagePath: res.storagePath,
                sha256Hash: res.sha256Hash,
                previewUrl: res.attachment.previewUrl,
              };
            } catch (uploadErr) {
              console.warn("Document upload fallback:", uploadErr);
            }
          }
          return {
            name: doc.name,
            size: doc.size,
            category: doc.category,
          };
        })
      );

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseTitle: caseTitle || "Legal Consultation Matter",
          category,
          jurisdiction,
          opposingParty: opposingParty.trim() || undefined,
          urgency: "Medium",
          situation: finalSituation,
          documents: processedDocuments,
          lawyers: currentLawyers,
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (data?.assessment) {
        const assessmentWithMeta = {
          ...data.assessment,
          opposingParty: opposingParty.trim() || undefined,
          documents: processedDocuments.length > 0 ? processedDocuments : data.assessment.documents,
        };

        try {
          await saveIntakeAssessment({
            rawText: finalSituation,
            category: data.assessment.category || "General Legal Counsel",
            subCategory: data.assessment.subCategory || data.assessment.category,
            jurisdiction: jurisdiction,
            urgency: data.assessment.urgency || "Medium",
            summary: data.assessment.summary || finalSituation.slice(0, 200),
            extractedKeyPoints: data.assessment.extractedKeyPoints || [],
            matchedLawyers: data.assessment.matchedLawyers || [],
            caseTitle: data.assessment.caseTitle || `${data.assessment.category} Matter`,
          });
        } catch (dbErr) {
          console.warn("Intake database persistence notice:", dbErr);
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("advocato_latest_intake", JSON.stringify(assessmentWithMeta));
          localStorage.setItem("advocato_intake_data", JSON.stringify(assessmentWithMeta));
        }
        router.push(`/lawyers?intakeId=${data.assessment.id}`);
      } else {
        throw new Error(data?.error || "Invalid response format");
      }
    } catch (err) {
      console.error("Match error, redirecting to lawyers directory:", err);
      clearInterval(interval);
      router.push("/lawyers");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 flex flex-col flex-grow">
        {/* Friendly Header */}
        <div className="pb-6 border-b border-hairline mb-8">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brass mb-2 px-2.5 py-1 rounded-md bg-surface-container-low border border-hairline">
            <Scale className="w-3.5 h-3.5 text-brass" />
            <span>Free Case Evaluation</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-semibold tracking-tight">
            Tell Us What Happened
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
            Explain your situation in plain English. No legal knowledge needed. We match you with verified, licensed lawyers in your state ready to help today.
          </p>
        </div>

        {/* 12-Column Responsive Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* Main Form (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Common Topic Shortcuts */}
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
              <span className="text-xs font-semibold text-primary block mb-2.5">
                Select a topic shortcut, or type below:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {COMMON_TOPICS.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTopic(topic)}
                    className={`px-4 py-3 rounded-lg text-xs font-medium border text-left transition-all duration-150 active:scale-[0.98] flex items-center justify-between ${
                      caseTitle === topic.title
                        ? "bg-primary text-white border-primary shadow-xs font-semibold"
                        : "bg-surface text-primary hover:border-slate/40 border-hairline hover:bg-surface-container-low"
                    }`}
                  >
                    <span>{topic.title}</span>
                    {caseTitle === topic.title && <CheckCircle2 className="w-3.5 h-3.5 text-brass" />}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleContinue(false);
              }}
              className="space-y-6"
            >
              {/* STEP 1: What happened */}
              <div className="bg-surface-container-lowest p-5 sm:p-7 rounded-xl border border-hairline shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brass uppercase tracking-wider">Step 1</span>
                    <span className="text-hairline">•</span>
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-primary">
                      What happened?
                    </h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Plain English • 100% Confidential
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Describe what occurred, when it happened, and what help you need (e.g. My employer terminated my contract without notice and offered a severance agreement with a non-compete clause. I want an attorney to review it.)..."
                    className="w-full bg-surface p-4 pb-14 text-xs sm:text-sm font-normal text-on-surface placeholder:text-outline-variant focus:outline-none resize-none rounded-lg border border-hairline focus:border-slate transition-all leading-relaxed"
                  />

                  {/* Dictation Tool */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      aria-label="Speak your story"
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-xs ${
                        isRecording
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-hairline"
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-brass" />}
                      <span>{isRecording ? "Listening... (Click to Stop)" : "Speak Your Story"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: Location and Documents */}
              <div className="bg-surface-container-lowest p-5 sm:p-7 rounded-xl border border-hairline shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brass uppercase tracking-wider">Step 2</span>
                    <span className="text-hairline">•</span>
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-primary">
                      Location &amp; Documents
                    </h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Matches you with Bar Council-enrolled advocates in your state
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary mb-1.5">
                    Which Indian state or UT did this occur in?
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-primary focus:outline-none focus:border-slate font-medium editorial-select"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary mb-1.5">
                    Opposing Party or Employer Name <span className="text-on-surface-variant font-normal">(Required for attorney conflict check)</span>
                  </label>
                  <input
                    type="text"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    placeholder="e.g. Acme Corporation, Former Employer, Landlord..."
                    className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-primary focus:outline-none focus:border-slate font-medium placeholder:text-outline-variant"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Attorneys must verify they do not represent the opposing party before evaluating confidential matters.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary mb-1.5">
                    Do you have any documents to share? <span className="text-on-surface-variant font-normal">(Optional)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                  />

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFilesSelected(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-brass bg-brass/5"
                        : "border-hairline hover:border-slate/40 hover:bg-surface-container-low"
                    }`}
                  >
                    <UploadCloud className="w-7 h-7 text-brass mx-auto mb-2" />
                    <p className="text-xs font-semibold text-primary">
                      Drag and drop documents here, or <span className="text-brass underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Contracts, severance letters, pay stubs, emails, or screenshots
                    </p>
                  </div>

                  {/* Uploaded Documents List */}
                  {documents.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <span className="text-[11px] font-semibold text-on-surface-variant block">
                        Attached Files ({documents.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-hairline text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <FileText className="w-4 h-4 text-brass shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-primary truncate">{doc.name}</p>
                                <span className="text-[10px] text-on-surface-variant">{doc.size}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeDocument(doc.id)}
                              className="text-on-surface-variant hover:text-red-600 p-1 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Reassurance Banner */}
              <div className="flex items-center gap-3 text-xs text-on-surface-variant bg-surface-container-low p-5 rounded-xl border border-hairline">
                <Lock className="w-4 h-4 text-brass shrink-0" />
                <span>
                  <strong>100% Private &amp; Confidential:</strong> Everything you share is strictly protected under attorney-client privilege. Your information is never sold or shared publicly.
                </span>
              </div>
            </form>
          </div>

          {/* Desktop Companion Sidebar (4 cols on desktop) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-24">
            {/* Live Case Checklist */}
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs space-y-3.5">
              <h3 className="font-headline text-sm font-semibold text-primary uppercase tracking-wider">
                Case Review Progress
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${caseTitle ? "bg-emerald-100 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-primary block">Legal Issue Selected</span>
                    <span className="text-[11px] text-on-surface-variant">{caseTitle || "Pick a topic shortcut above"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${situation.trim() ? "bg-emerald-100 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-primary block">Situation Explained</span>
                    <span className="text-[11px] text-on-surface-variant">{situation.trim() ? `${situation.length} characters written` : "Describe in your own words"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-primary block">Jurisdiction</span>
                    <span className="text-[11px] text-on-surface-variant">{jurisdiction}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${documents.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-primary block">Documents (Optional)</span>
                    <span className="text-[11px] text-on-surface-variant">{documents.length > 0 ? `${documents.length} files attached` : "Attach if available"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Advocato Reassurance */}
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs space-y-3">
              <h3 className="font-headline text-sm font-semibold text-primary">
                Why Case Review is 100% Free
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Advocato helps you understand whether you have a viable legal claim without paying costly upfront retainer fees. You review matched attorneys and choose who to speak with.
              </p>
              <div className="pt-2 border-t border-hairline space-y-2 text-xs text-primary font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                  <span>Licensed State Bar Attorneys Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                  <span>Transparent Upfront Hourly Rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                  <span>Zero Obligation to Hire</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="p-4 md:px-8 bg-surface/95 backdrop-blur-md sticky bottom-16 md:bottom-0 z-20 border-t border-hairline mt-auto shadow-xs">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => handleContinue(true)}
            className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-all duration-150 active:scale-95 py-2 px-3 rounded-lg hover:bg-surface-container-low"
          >
            Skip &amp; browse all lawyers &rarr;
          </button>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => handleContinue(false)}
            className="px-7 py-3 rounded-lg text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-slate-dark flex items-center gap-2 shadow-sm hover:shadow-md btn-editorial disabled:opacity-75 ml-auto min-h-[46px]"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="truncate max-w-[280px]">{ANALYSIS_STAGES[analysisStage]}</span>
              </>
            ) : (
              <>
                <span>Find Matching Lawyers</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
