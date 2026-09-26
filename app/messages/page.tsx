"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  Eye,
  Download,
  X,
  ArrowLeft,
  Lock,
  Calendar,
  Info,
  Plus,
  Scale,
  ShieldCheck,
  User,
  RefreshCw,
  AlertTriangle,
  PhoneCall,
  PhoneOff,
  Copy,
  Volume2,
  FolderOpen,
} from "lucide-react";
import {
  INITIAL_CONSULTATIONS,
  getStoredConsultations,
  saveStoredConsultations,
  getOrCreateConsultationForLawyer,
} from "@/lib/data/consultations";
import { getAllLawyers } from "@/lib/data/lawyers";
import { Consultation, ConsultationMessage, DocumentAttachment, Lawyer } from "@/types";
import { useUserRole, getInitialsAvatar } from "@/lib/context/RoleContext";
import { createClient } from "@/lib/supabase/client";
import { getUserMatters } from "@/lib/supabase/matters";
import { uploadEvidentiaryDocument, uploadVoiceNoteBlob } from "@/lib/storage/documents";
import { VideoConsultationRoom } from "@/components/consultation/VideoConsultationRoom";

const EMOJI_LIST = ["👍", "🤝", "⚖️", "📄", "✅", "🙏", "👏", "💡"];

function MessagesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lawyerIdParam = searchParams.get("lawyerId");
  const matterIdParam = searchParams.get("matterId") || searchParams.get("id");

  const { role, activeLawyer, currentUser } = useUserRole();

  const [consultations, setConsultations] = useState<Consultation[]>(INITIAL_CONSULTATIONS);
  const [activeMatterId, setActiveMatterId] = useState<string>("");
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "active">("all");

  // New consultation modal
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [allLawyersList, setAllLawyersList] = useState<Lawyer[]>([]);

  // Input & state
  const [inputText, setInputText] = useState("");
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Audio voice note state
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(35);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);

  // Voice & Media Refs
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [activeCallModal, setActiveCallModal] = useState<"video" | "phone" | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentAttachment | null>(null);
  const [phoneCallConnected, setPhoneCallConnected] = useState(false);
  const [phoneCallDuration, setPhoneCallDuration] = useState(0);
  const [phoneIsMuted, setPhoneIsMuted] = useState(false);
  const [copiedBridgePin, setCopiedBridgePin] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneCallConnected) {
      timer = setInterval(() => {
        setPhoneCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setPhoneCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [phoneCallConnected]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize consultations: load from Supabase matters, fallback to storage
  useEffect(() => {
    async function initConsultations() {
      setAllLawyersList(getAllLawyers());

      let activeList: Consultation[] = [];

      try {
        const { matters: dbMatters, error } = await getUserMatters();
        if (!error && dbMatters && dbMatters.length > 0) {
          activeList = dbMatters.map((m) => {
            const counselorName = m.lawyer?.full_name || "Assigned Counsel";
            return {
              id: m.id,
              matterNumber: m.matter_number,
              caseTitle: m.case_title,
              category: m.category,
              status: (m.status as any) || "active",
              clientName: m.client?.full_name || "Client",
              lawyer: {
                id: m.lawyer?.id || m.lawyer_id,
                name: counselorName,
                title: `${m.category} Attorney`,
                avatar: m.lawyer?.avatar_url || getInitialsAvatar(counselorName),
                rating: 5.0,
                reviewCount: 1,
                hourlyRate: 2500,
                isVerified: true,
                availability: "Available today",
                yearsExperience: 5,
                jurisdiction: m.jurisdiction || "Delhi (DL)",
                tags: [m.category],
                practiceAreas: [m.category],
                bio: "Licensed counsel handling active matter.",
                notableCases: [],
              },
              messages: [],
              lastActive: "Active today",
              unreadCount: 0,
            };
          });
        }
      } catch (err) {
        console.warn("Could not load matters from DB:", err);
      }

      if (activeList.length === 0) {
        activeList = getStoredConsultations();
      }

      let targetMatterId = activeList.length > 0 ? activeList[0].id : "";
      let shouldShowChatOnMobile = false;

      if (lawyerIdParam) {
        const dynamicConsultation = getOrCreateConsultationForLawyer(lawyerIdParam, currentUser.name);
        const updatedList = [
          dynamicConsultation,
          ...activeList.filter((c) => c.id !== dynamicConsultation.id),
        ];
        activeList = updatedList;
        targetMatterId = dynamicConsultation.id;
        shouldShowChatOnMobile = true;
      } else if (matterIdParam) {
        const existing = activeList.find((c) => c.id === matterIdParam);
        if (existing) {
          targetMatterId = existing.id;
          shouldShowChatOnMobile = true;
        }
      }

      setConsultations(activeList);
      setActiveMatterId(targetMatterId);
      setMobileShowChat(shouldShowChatOnMobile);
    }

    initConsultations();
  }, [lawyerIdParam, matterIdParam, currentUser.name, role]);

  // 2. Load historical messages from Supabase for the active matter
  useEffect(() => {
    if (!activeMatterId) return;

    async function loadMatterMessages() {
      const supabase = createClient();
      try {
        const { data: dbMessages, error } = await supabase
          .from("messages")
          .select("*, document:documents(*)")
          .eq("matter_id", activeMatterId)
          .order("created_at", { ascending: true });

        if (!error && dbMessages && dbMessages.length > 0) {
          const mappedMsgs: ConsultationMessage[] = dbMessages.map((m: any) => ({
            id: m.id,
            senderRole: m.sender_role,
            senderName: m.sender_role === "lawyer" ? (activeConsultation?.lawyer?.name || "Attorney") : (currentUser.name || "Client"),
            text: m.text || "",
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "read",
            document: m.document ? {
              id: m.document.id,
              name: m.document.name,
              size: `${Math.round(m.document.size_bytes / 1024)} KB`,
              category: m.document.category || "Evidence",
              previewUrl: m.document.storage_path,
              downloadUrl: m.document.storage_path,
              isReviewed: m.document.is_reviewed,
            } : undefined,
          }));

          setConsultations((prev) =>
            prev.map((c) => (c.id === activeMatterId ? { ...c, messages: mappedMsgs } : c))
          );
        }
      } catch (err) {
        console.warn("Could not load messages from DB:", err);
      }
    }

    loadMatterMessages();
  }, [activeMatterId]);

  // 3. Supabase Realtime Channel Subscription for instant duplex messaging & DB changes
  useEffect(() => {
    if (!activeMatterId) return;
    const supabase = createClient();
    const channelName = `matter-chat-${activeMatterId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        if (payload) {
          setConsultations((prev) =>
            prev.map((c) => {
              if (c.id === activeMatterId) {
                if (c.messages.some((m) => m.id === payload.id)) return c;
                return {
                  ...c,
                  messages: [...c.messages, payload],
                  lastActive: "online",
                };
              }
              return c;
            })
          );
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `matter_id=eq.${activeMatterId}`,
        },
        (payload) => {
          const r: any = payload.new;
          if (!r) return;
          const incomingMsg: ConsultationMessage = {
            id: r.id,
            senderRole: r.sender_role,
            senderName: r.sender_role === "lawyer" ? (activeConsultation?.lawyer?.name || "Attorney") : (currentUser.name || "Client"),
            text: r.text || "",
            timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "read",
          };

          setConsultations((prev) =>
            prev.map((c) => {
              if (c.id === activeMatterId) {
                if (c.messages.some((m) => m.id === incomingMsg.id || m.text === incomingMsg.text)) return c;
                return {
                  ...c,
                  messages: [...c.messages, incomingMsg],
                  lastActive: "online",
                };
              }
              return c;
            })
          );
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload && payload.senderRole !== role) {
          setIsCounterpartTyping(Boolean(payload.isTyping));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeMatterId, role]);

  const activeConsultation =
    consultations.find((c) => c.id === activeMatterId) || (consultations.length > 0 ? consultations[0] : null);

  const messages = activeConsultation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCounterpartTyping]);

  // Voice note timer counter
  useEffect(() => {
    let interval: any;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setRecordTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const handleSelectMatter = (id: string) => {
    setActiveMatterId(id);
    setMobileShowChat(true);
  };

  const handleStartConsultationWithLawyer = (lawyer: Lawyer) => {
    const cons = getOrCreateConsultationForLawyer(lawyer.id);
    const updated = [cons, ...consultations.filter((c) => c.id !== cons.id)];
    setConsultations(updated);
    saveStoredConsultations(updated);
    setActiveMatterId(cons.id);
    setMobileShowChat(true);
    setShowNewConsultationModal(false);
  };

  // Broadcast typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    const supabase = createClient();
    supabase.channel(`matter-chat-${activeMatterId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping: val.length > 0, senderRole: role },
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConsultation) return;

    const currentText = inputText;
    const isLawyerSender = role === "lawyer";

    const newMsg: ConsultationMessage = {
      id: `msg-${Date.now()}`,
      senderRole: isLawyerSender ? "lawyer" : "client",
      senderName: isLawyerSender ? (activeLawyer?.name || "Lead Counsel") : currentUser.name,
      senderAvatar: isLawyerSender ? activeLawyer?.avatar : undefined,
      text: currentText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    const updatedConsultations = consultations.map((c) => {
      if (c.id === activeConsultation.id) {
        return {
          ...c,
          messages: [...c.messages, newMsg],
          lastActive: "online",
        };
      }
      return c;
    });

    setConsultations(updatedConsultations);
    saveStoredConsultations(updatedConsultations);
    setInputText("");
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    // Broadcast across Supabase Realtime to connected peers
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Persist to Supabase messages table if active
    if (user && activeConsultation?.id) {
      try {
        await supabase.from("messages").insert({
          matter_id: activeConsultation.id,
          sender_id: user.id,
          sender_role: role,
          text: currentText,
        });
      } catch (err) {
        console.warn("Message DB insertion notice:", err);
      }
    }

    supabase.channel(`matter-chat-${activeMatterId}`).send({
      type: "broadcast",
      event: "new-message",
      payload: newMsg,
    });
    supabase.channel(`matter-chat-${activeMatterId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { isTyping: false, senderRole: role },
    });
  };

  // Native Web Audio Recorder Start
  const startVoiceRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setIsRecordingVoice(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
      setRecordTimer(0);
    } catch (err) {
      console.warn("Microphone access unavailable, using simulated recording:", err);
      setIsRecordingVoice(true);
      setRecordTimer(0);
    }
  };

  // Stop Web Audio Recorder and Upload to Supabase Storage
  const handleSendVoiceNote = async () => {
    if (!activeConsultation) return;
    setIsRecordingVoice(false);
    const durationStr = `0:${recordTimer < 10 ? "0" + recordTimer : recordTimer}`;

    let audioUrl: string | undefined = undefined;
    let storagePath: string | undefined = undefined;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());

      // Small delay to ensure all audio chunks flush
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const res = await uploadVoiceNoteBlob(audioBlob, activeMatterId, durationStr);
        audioUrl = res.audioUrl;
        storagePath = res.storagePath;
      }
    }

    const isLawyerSender = role === "lawyer";
    const voiceMsg: ConsultationMessage = {
      id: `voice-${Date.now()}`,
      senderRole: isLawyerSender ? "lawyer" : "client",
      senderName: isLawyerSender ? (activeLawyer?.name || "Lead Counsel") : currentUser.name,
      senderAvatar: isLawyerSender ? activeLawyer?.avatar : undefined,
      text: "🎤 Confidential Audio Memo",
      isVoiceNote: true,
      audioDuration: durationStr,
      audioUrl: audioUrl,
      audioStoragePath: storagePath,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    const updated = consultations.map((c) => {
      if (c.id === activeConsultation.id) {
        return { ...c, messages: [...c.messages, voiceMsg] };
      }
      return c;
    });

    setConsultations(updated);

    // Persist voice note message to Supabase messages table
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && activeConsultation?.id) {
      try {
        await supabase.from("messages").insert({
          matter_id: activeConsultation.id,
          sender_id: user.id,
          sender_role: role,
          text: "🎤 Voice Note",
          audio_url: voiceMsg.audioUrl,
          audio_storage_path: voiceMsg.audioStoragePath,
          audio_duration: voiceMsg.audioDuration,
          is_voice_note: true,
        });
      } catch (err) {
        console.warn("Voice note DB insertion notice:", err);
      }
    }

    supabase.channel(`matter-chat-${activeMatterId}`).send({
      type: "broadcast",
      event: "new-message",
      payload: voiceMsg,
    });
  };

  // Native Chat Evidentiary Document Upload
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeConsultation) return;
    const file = files[0];

    const result = await uploadEvidentiaryDocument(file, activeMatterId, "Case Exhibit");
    const isLawyerSender = role === "lawyer";

    const docMsg: ConsultationMessage = {
      id: `msg-doc-${Date.now()}`,
      senderRole: isLawyerSender ? "lawyer" : "client",
      senderName: isLawyerSender ? (activeLawyer?.name || "Lead Counsel") : currentUser.name,
      senderAvatar: isLawyerSender ? activeLawyer?.avatar : undefined,
      text: `Attached privileged evidentiary exhibit: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachment: result.attachment,
      status: "sent",
    };

    const updated = consultations.map((c) => {
      if (c.id === activeConsultation.id) {
        return { ...c, messages: [...c.messages, docMsg] };
      }
      return c;
    });

    setConsultations(updated);
    saveStoredConsultations(updated);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && activeConsultation?.id) {
      try {
        const { data: insertedDoc } = await supabase.from("documents").insert({
          matter_id: activeConsultation.id,
          uploader_id: user.id,
          name: file.name,
          size_bytes: file.size,
          mime_type: file.type || "application/octet-stream",
          storage_path: result.storagePath,
          category: "Case Exhibit",
          sha256_hash: result.sha256Hash,
          is_privileged: true,
          is_reviewed: false,
        }).select("id").single();

        await supabase.from("messages").insert({
          matter_id: activeConsultation.id,
          sender_id: user.id,
          sender_role: role,
          text: `Attached privileged evidentiary exhibit: ${file.name}`,
          document_id: insertedDoc?.id || null,
        });
      } catch (err) {
        console.warn("Document DB insertion notice:", err);
      }
    }

    supabase.channel(`matter-chat-${activeMatterId}`).send({
      type: "broadcast",
      event: "new-message",
      payload: docMsg,
    });

    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = "";
    }
  };

  // Real HTML5 Audio Player toggle
  const handleTogglePlayAudio = (msgId: string, audioUrl?: string) => {
    if (isPlayingAudio === msgId) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlayingAudio(null);
    } else {
      if (audioUrl) {
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio(audioUrl);
        } else {
          audioElementRef.current.src = audioUrl;
        }
        audioElementRef.current.play().catch(() => {});
        audioElementRef.current.onended = () => {
          setIsPlayingAudio(null);
          setAudioProgress(0);
        };
        audioElementRef.current.ontimeupdate = () => {
          if (audioElementRef.current && audioElementRef.current.duration) {
            setAudioProgress(
              (audioElementRef.current.currentTime / audioElementRef.current.duration) * 100
            );
          }
        };
      } else {
        // Fallback simulation for seed messages
        setAudioProgress(0);
        const interval = setInterval(() => {
          setAudioProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsPlayingAudio(null);
              return 0;
            }
            return prev + 10;
          });
        }, 300);
      }
      setIsPlayingAudio(msgId);
    }
  };

  const handleClearConflict = (consultationId: string) => {
    const updated = consultations.map((c) =>
      c.id === consultationId ? { ...c, conflictStatus: "cleared" as const } : c
    );
    setConsultations(updated);
    saveStoredConsultations(updated);
  };

  const filteredConversations = consultations.filter((c) => {
    if (role === "lawyer" && activeLawyer) {
      if (c.lawyer.id !== activeLawyer.id) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.lawyer.name.toLowerCase().includes(q) ||
        c.caseTitle.toLowerCase().includes(q) ||
        c.matterNumber.toLowerCase().includes(q) ||
        c.clientName?.toLowerCase().includes(q) ||
        (c.opposingParty && c.opposingParty.toLowerCase().includes(q))
      );
    }
    if (filterTab === "unread") {
      const last = c.messages[c.messages.length - 1];
      return last && last.status !== "read";
    }
    return true;
  });

  return (
    <div className="fixed inset-x-0 top-16 bottom-[76px] md:static md:h-[calc(100dvh-4rem)] md:-mb-10 flex flex-col bg-surface overflow-hidden z-20">
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto md:p-3 md:pb-3 overflow-hidden">
        <div className="flex-1 flex bg-surface-container-lowest md:rounded-2xl border-0 md:border md:border-hairline shadow-editorial overflow-hidden relative">
          
          {/* ================= LEFT SIDEBAR (CONVERSATIONS INBOX) ================= */}
          <div
            className={`w-full md:w-[360px] lg:w-[400px] shrink-0 flex flex-col border-r border-hairline bg-surface overflow-hidden ${
              mobileShowChat ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Sidebar Header with Role Context */}
            <div className="h-16 px-4 bg-surface-container-low border-b border-hairline flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  {role === "lawyer" ? "JD" : (currentUser.name ? currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "AM")}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-primary truncate">
                    {role === "lawyer" ? (activeLawyer?.name || "Lead Counsel") : currentUser.name}
                  </span>
                  <span className="text-[10px] text-brass font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-brass" />
                    <span>{role === "lawyer" ? "Verified Lawyer" : "Client Account"}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-on-surface-variant shrink-0">
                <button
                  type="button"
                  title="Start new conversation"
                  onClick={() => setShowNewConsultationModal(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-brass text-white hover:bg-brass-hover transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-2.5 bg-surface-container-lowest border-b border-hairline shrink-0">
              <div className="relative flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-hairline/60">
                <Search className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder={role === "lawyer" ? "Search clients..." : "Search conversations..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline-variant focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-on-surface-variant hover:text-primary">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 py-2 flex items-center gap-1.5 border-b border-hairline/60 bg-surface-container-lowest overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  filterTab === "all"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                All ({consultations.length})
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  filterTab === "unread"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                Active
              </button>
              {role === "client" && (
                <button
                  onClick={() => setShowNewConsultationModal(true)}
                  className="ml-auto text-[11px] font-semibold text-brass hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New Chat
                </button>
              )}
            </div>

            {/* Conversations Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-hairline/60">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center justify-center h-full my-auto">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-3">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-primary mb-1">
                    {role === "lawyer" ? "No Client Inquiries Yet" : "No Messages Yet"}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mb-4 leading-relaxed max-w-[220px]">
                    {role === "lawyer"
                      ? "When a client submits a case or books a consultation, your conversations will appear here."
                      : "You have no active conversations. Start a case or message a lawyer to begin."}
                  </p>
                  {role === "lawyer" ? (
                    <Link
                      href="/cases"
                      className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>View Case Docket</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowNewConsultationModal(true)}
                      className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Find a Lawyer</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = c.id === activeMatterId;
                  const lastMsg = c.messages[c.messages.length - 1];
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectMatter(c.id)}
                      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors relative ${
                        isActive ? "bg-surface-container-low border-l-3 border-brass" : "hover:bg-surface-container-low/60"
                      }`}
                    >
                      <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-hairline">
                        {role === "lawyer" ? (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-xs">
                            {(c.clientName || "CL").slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <img src={c.lawyer.avatar} alt={c.lawyer.name} className="w-full h-full object-cover" />
                        )}
                        {c.lastActive === "online" && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-primary truncate flex items-center gap-1">
                            <span>{role === "lawyer" ? (c.clientName || "Client") : c.lawyer.name}</span>
                            {role === "client" && c.lawyer.isVerified && (
                              <span className="w-3 h-3 rounded-full bg-brass flex items-center justify-center shrink-0">
                                <Check className="w-2 h-2 text-white stroke-[3]" />
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-on-surface-variant shrink-0 tabular-nums">
                            {lastMsg?.timestamp || "Today"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-brass font-semibold bg-brass/10 px-1.5 py-0.5 rounded shrink-0 max-w-[120px] truncate">
                            {c.caseTitle}
                          </span>
                          <p className="text-[11px] text-on-surface-variant truncate font-normal">
                            {lastMsg ? (
                              <>
                                {lastMsg.senderRole === "client" && (
                                   <CheckCheck className="w-3 h-3 inline text-brass mr-0.5" />
                                )}
                                {lastMsg.isVoiceNote ? "🎤 Voice Note" : lastMsg.text}
                              </>
                            ) : (
                              c.caseTitle
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= RIGHT MAIN CHAT PANE ================= */}
          <div
            className={`flex-1 flex flex-col bg-surface relative overflow-hidden ${
              !mobileShowChat ? "hidden md:flex" : "flex"
            }`}
          >
            {!activeConsultation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-surface">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-4 shadow-xs">
                  <Scale className="w-7 h-7" />
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-semibold text-primary mb-2">No Conversation Selected</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
                  {role === "lawyer"
                    ? "Select an active client conversation to review case details, send messages, and host privileged video consultations."
                    : "Choose a conversation from the list or start a new consultation with a verified lawyer."}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {role === "lawyer" ? (
                    <>
                      <Link
                        href="/cases"
                        className="w-full sm:w-auto bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
                      >
                        <FolderOpen className="w-4 h-4 text-brass" />
                        <span>View All Client Cases</span>
                      </Link>
                      {activeLawyer && (
                        <Link
                          href={`/lawyers/${activeLawyer.id}`}
                          className="w-full sm:w-auto border border-hairline hover:bg-surface-container text-primary text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center transition-colors min-h-[44px]"
                        >
                          <span>View My Profile</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowNewConsultationModal(true)}
                        className="w-full sm:w-auto bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Find a Lawyer</span>
                      </button>
                      <Link
                        href="/intake"
                        className="w-full sm:w-auto border border-hairline hover:bg-surface-container text-primary text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center transition-colors min-h-[44px]"
                      >
                        Tell Us What Happened
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Compact Chat Header */}
                <div className="h-16 px-4 bg-surface-container-low border-b border-hairline flex items-center justify-between relative z-10 shadow-xs shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Mobile Back to Inbox Button */}
                    <button
                      type="button"
                      onClick={() => setMobileShowChat(false)}
                      className="md:hidden w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary -ml-1 shrink-0 rounded-lg hover:bg-surface-container"
                      title="Back to conversation list"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div
                      onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                      className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-hairline shrink-0 flex items-center justify-center bg-primary/10">
                        {role === "lawyer" ? (
                          <span className="text-xs font-bold text-primary">
                            {(activeConsultation.clientName || currentUser.name || "CL").slice(0, 2).toUpperCase()}
                          </span>
                        ) : (
                          <img
                            src={activeConsultation.lawyer.avatar}
                            alt={activeConsultation.lawyer.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {activeConsultation.lastActive === "online" && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <h3 className="text-xs sm:text-sm font-bold text-primary truncate leading-tight">
                            {role === "lawyer" ? `${activeConsultation.clientName || currentUser.name} (Client)` : activeConsultation.lawyer.name}
                          </h3>
                      {role !== "lawyer" && activeConsultation.lawyer.isVerified && (
                        <div className="w-3.5 h-3.5 rounded-full bg-brass flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-on-surface-variant truncate">
                      {isCounterpartTyping ? (
                        <span className="text-brass font-semibold animate-pulse">typing...</span>
                      ) : (
                        <span>
                          {role === "lawyer" ? "Active Client" : activeConsultation.lawyer.title}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveCallModal("phone")}
                  aria-label="Direct audio call"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-hairline hover:bg-surface-container text-on-surface-variant transition-colors"
                  title="Direct audio call"
                >
                  <Phone className="w-4 h-4 text-primary" />
                </button>

                <button
                  onClick={() => setActiveCallModal("video")}
                  aria-label="Private video call"
                  className="px-3 py-1.5 rounded-lg bg-brass text-white text-xs font-semibold hover:bg-brass-hover flex items-center gap-1.5 shadow-2xs transition-colors min-h-[36px]"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>

                <button
                  onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                  aria-label="Case details"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-hairline hover:bg-surface-container text-on-surface-variant transition-colors"
                  title="Case details"
                >
                  <Info className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>

            {/* Scheduled Consultation / Escrow Banner */}
            {activeConsultation.appointmentDate && (
              <div className="bg-brass/10 border-b border-brass/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10 shrink-0">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Calendar className="w-3.5 h-3.5 text-brass shrink-0" />
                  <span>
                    Scheduled: <strong>{activeConsultation.appointmentDate}</strong> ({activeConsultation.consultationType || "Video"} Consultation)
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Pre-Authorized Escrow (₹{activeConsultation.lawyer.hourlyRate.toLocaleString("en-IN")})
                  </span>
                </div>
                <button
                  onClick={() => setActiveCallModal(activeConsultation.consultationType === "phone" ? "phone" : "video")}
                  className="px-2.5 py-1 rounded bg-brass text-white text-[11px] font-semibold hover:bg-brass-hover transition-colors shadow-2xs"
                >
                  Join Meeting
                </button>
              </div>
            )}

            {/* Conflict of Interest Warning Banner */}
            {activeConsultation.opposingParty && (
              <div className={`px-4 py-2 border-b text-xs relative z-10 shrink-0 flex flex-wrap items-center justify-between gap-2 ${
                activeConsultation.conflictStatus === "flagged" 
                  ? "bg-amber-50 border-amber-200 text-amber-900" 
                  : "bg-surface-container-low border-hairline text-on-surface-variant"
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                    activeConsultation.conflictStatus === "flagged" ? "text-amber-600" : "text-brass"
                  }`} />
                  <span className="truncate">
                    Opposing Party: <strong>{activeConsultation.opposingParty}</strong> • Conflict Check:{" "}
                    <span className={`font-semibold capitalize ${activeConsultation.conflictStatus === "flagged" ? "text-amber-700" : "text-emerald-700"}`}>
                      {activeConsultation.conflictStatus || "Cleared"}
                    </span>
                  </span>
                </div>
                {role === "lawyer" && activeConsultation.conflictStatus !== "cleared" && (
                  <button
                    onClick={() => handleClearConflict(activeConsultation.id)}
                    className="px-2 py-0.5 rounded bg-surface-container-lowest border border-hairline text-[10px] font-bold text-primary hover:bg-surface-container transition-colors shrink-0"
                  >
                    Mark Conflict Cleared
                  </button>
                )}
              </div>
            )}

            {/* Case Details Banner */}
            <div className="hidden md:flex bg-surface-container-lowest px-4 py-2 border-b border-hairline items-center justify-between text-xs relative z-10 shrink-0">
              <div className="flex items-center gap-2 truncate text-primary font-medium">
                <Lock className="w-3.5 h-3.5 text-brass shrink-0" />
                <span className="truncate">
                  Topic: <strong>{activeConsultation.caseTitle}</strong> • Confidential Attorney Consultation
                </span>
              </div>
              <Link
                href={`/lawyers/${activeConsultation.lawyer.id}`}
                className="text-brass hover:underline text-[11px] font-semibold shrink-0 ml-2"
              >
                View Profile &rarr;
              </Link>
            </div>

            {/* ================= MESSAGE STREAM ================= */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 flex flex-col gap-3 relative z-10">
              {/* Privacy Capsule */}
              <div className="flex items-center justify-center my-1">
                <span className="bg-surface-container-low text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md border border-hairline shadow-2xs">
                  Private &amp; Confidential
                </span>
              </div>

              {/* Confidentiality Notice */}
              <div className="max-w-md mx-auto my-1 px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] text-center border border-hairline leading-relaxed flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-brass shrink-0" />
                <span>Protected by Attorney-Client Privacy. Your conversation is strictly confidential.</span>
              </div>

              {messages.map((msg) => {
                const isSentByMe = role === "lawyer" ? msg.senderRole === "lawyer" : msg.senderRole === "client";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group relative max-w-[88%] sm:max-w-[75%] md:max-w-[65%] ${
                      isSentByMe ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`relative px-3.5 py-2.5 rounded-xl shadow-xs transition-all ${
                        isSentByMe
                          ? "bg-primary text-white rounded-tr-none border border-primary/20"
                          : "bg-surface-container-lowest text-primary rounded-tl-none border border-hairline shadow-2xs"
                      }`}
                    >
                      {/* Sender Header */}
                      <div
                        className={`text-[10px] font-bold mb-1 flex items-center justify-between gap-2 ${
                          isSentByMe ? "text-brass" : "text-slate"
                        }`}
                      >
                        <span>{msg.senderName}</span>
                        <span className="text-[9px] font-normal opacity-80">{msg.timestamp}</span>
                      </div>

                      {/* Content: Voice Note */}
                      {msg.isVoiceNote ? (
                        <div className="flex items-center gap-2.5 py-1 pr-1 w-[210px] sm:w-[240px]">
                          <button
                            onClick={() => handleTogglePlayAudio(msg.id, msg.audioUrl)}
                            className="w-8 h-8 rounded-full bg-brass text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-brass-hover transition-colors"
                          >
                            {isPlayingAudio === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>

                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-0.5 h-5">
                              {[10, 16, 8, 20, 14, 22, 12, 18, 9, 20, 15, 10, 22, 12, 16, 8].map(
                                (barHeight, idx) => {
                                  const isPlayed = idx < (audioProgress / 100) * 16;
                                  return (
                                    <div
                                      key={idx}
                                      className={`w-1 rounded-full transition-colors ${
                                        isPlayed ? "bg-brass" : isSentByMe ? "bg-white/30" : "bg-gray-300"
                                      }`}
                                      style={{ height: `${barHeight}px` }}
                                    />
                                  );
                                }
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[9px] opacity-70 font-medium tabular-nums">
                              <span>{msg.audioDuration || "0:38"}</span>
                              <span>Voice Note</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Text Content */
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      )}

                      {/* Document Card */}
                      {msg.attachment && (
                        <div
                          className={`mt-2 rounded-lg border p-2.5 flex items-start gap-2.5 ${
                            isSentByMe
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-surface-container-low border-hairline text-primary"
                          }`}
                        >
                          <div className="w-9 h-11 bg-surface-container-lowest border border-hairline rounded flex items-center justify-center shrink-0 shadow-2xs">
                            <FileText className="w-4 h-4 text-brass" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[11px] sm:text-xs font-bold truncate">{msg.attachment.name}</h5>
                            <span className="text-[9px] opacity-70 block mt-0.5">
                              {msg.attachment.size} • {msg.attachment.category}
                            </span>
                            {msg.attachment.sha256Hash && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-0.5">
                                <Check className="w-2.5 h-2.5" /> Verified Secure File
                              </span>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                onClick={() => setPreviewDoc(msg.attachment!)}
                                className="text-[11px] font-semibold text-brass hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View File
                              </button>
                              {msg.attachment.downloadUrl && (
                                <a
                                  href={msg.attachment.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msg.attachment.name}
                                  className="text-[11px] font-semibold opacity-80 hover:opacity-100 flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Counterpart Typing Indicator */}
              {isCounterpartTyping && (
                <div className="self-start flex items-center gap-2 bg-surface-container-lowest px-3.5 py-2 rounded-xl rounded-tl-none border border-hairline shadow-2xs text-xs text-on-surface-variant">
                  <div className="w-1.5 h-1.5 rounded-full bg-brass animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brass animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brass animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-medium text-slate">
                    {activeConsultation.lawyer.name} is typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ================= DOCKED INPUT BAR ================= */}
            <div className="p-2.5 bg-surface-container-low border-t border-hairline relative z-20 shrink-0">
              {/* Attachments Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-16 left-4 bg-surface-container-lowest rounded-xl border border-hairline shadow-editorial p-2 flex flex-col gap-1 z-30 min-w-[220px]">
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      chatFileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface-container-low text-xs font-semibold text-primary transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-brass" />
                    <span>Upload Document or Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      setActiveCallModal("video");
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface-container-low text-xs font-semibold text-primary transition-colors text-left"
                  >
                    <Video className="w-4 h-4 text-brass" />
                    <span>Start Video Call</span>
                  </button>
                </div>
              )}

              {/* Hidden File Input for Evidentiary Document Upload */}
              <input
                type="file"
                ref={chatFileInputRef}
                onChange={handleChatFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />

              {/* Emoji Tray */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 bg-surface-container-lowest rounded-xl border border-hairline shadow-editorial p-2 flex items-center gap-1.5 z-30">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setInputText((prev) => prev + emoji)}
                      className="text-base p-1 hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Voice Recording View */}
              {isRecordingVoice ? (
                <div className="flex items-center justify-between gap-2 bg-surface-container-lowest border border-brass/40 rounded-xl px-3.5 py-2 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brass">
                    <span className="w-2 h-2 rounded-full bg-brass animate-ping" />
                    <span>Recording Voice Note: 0:{recordTimer < 10 ? "0" + recordTimer : recordTimer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(false)}
                      className="text-xs font-medium text-on-surface-variant hover:text-primary px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendVoiceNote}
                      className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-xs"
                    >
                      Send Voice Note
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Input Bar */
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Insert emoji"
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    aria-label="Attach file"
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={
                      role === "lawyer"
                        ? `Message ${activeConsultation.clientName || currentUser.name}...`
                        : `Message ${activeConsultation.lawyer.name}...`
                    }
                    className="flex-1 bg-surface-container-lowest border border-hairline rounded-lg px-3.5 py-2 text-xs sm:text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-slate shadow-2xs"
                  />

                  {inputText.trim() ? (
                    <button
                      type="submit"
                      aria-label="Send message"
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-brass hover:bg-brass-hover text-white shadow-xs transition-all active:scale-95 shrink-0"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      aria-label="Record voice note"
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant shadow-2xs transition-all active:scale-95 shrink-0"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </div>
              </>
            )}
          </div>

          {/* ================= CASE DETAILS DRAWER ================= */}
          {showInfoDrawer && activeConsultation && (
            <div className="w-full sm:w-[320px] shrink-0 border-l border-hairline bg-surface flex flex-col absolute sm:relative right-0 top-0 bottom-0 z-30 shadow-editorial animate-in slide-in-from-right duration-150">
              <div className="h-16 px-4 border-b border-hairline flex items-center justify-between bg-surface-container-low shrink-0">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Case Details</h4>
                <button onClick={() => setShowInfoDrawer(false)} className="text-on-surface-variant hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex flex-col items-center text-center">
                  {role === "lawyer" ? (
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-hairline flex items-center justify-center text-lg font-bold text-primary mb-2 shadow-xs">
                      {(activeConsultation.clientName || currentUser.name || "CL").slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <img
                      src={activeConsultation.lawyer.avatar}
                      alt={activeConsultation.lawyer.name}
                      className="w-16 h-16 rounded-full object-cover border border-hairline shadow-sm mb-2"
                    />
                  )}
                  <h3 className="font-headline text-base font-bold text-primary">
                    {role === "lawyer" ? (activeConsultation.clientName || currentUser.name) : activeConsultation.lawyer.name}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    {role === "lawyer" ? "Matter Client" : activeConsultation.lawyer.title}
                  </span>
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-brass font-semibold bg-brass/10 px-2 py-0.5 rounded-md">
                    {activeConsultation.jurisdiction || activeConsultation.lawyer.jurisdiction || "Jurisdiction Verified"}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-hairline space-y-2 text-xs">
                  <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                    <span>Case Topic</span>
                    <span className="font-semibold text-primary">{activeConsultation.caseTitle}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                    <span>Client</span>
                    <span className="font-semibold text-primary">{activeConsultation.clientName || currentUser.name}</span>
                  </div>
                  {activeConsultation.opposingParty && (
                    <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                      <span>Opposing Party</span>
                      <span className="font-semibold text-primary">{activeConsultation.opposingParty}</span>
                    </div>
                  )}
                  {activeConsultation.conflictStatus && (
                    <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                      <span>Conflict Review</span>
                      <span className={`font-semibold capitalize ${
                        activeConsultation.conflictStatus === "flagged" ? "text-amber-700" : "text-emerald-700"
                      }`}>
                        {activeConsultation.conflictStatus}
                      </span>
                    </div>
                  )}
                  {activeConsultation.appointmentDate && (
                    <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                      <span>Scheduled Slot</span>
                      <span className="font-semibold text-primary">{activeConsultation.appointmentDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                    <span>Rate / Escrow</span>
                    <span className="font-semibold text-primary">₹{activeConsultation.lawyer.hourlyRate.toLocaleString("en-IN")}/hr</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Privacy</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Protected &amp; Encrypted
                    </span>
                  </div>
                </div>

                {activeConsultation.documents && activeConsultation.documents.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      Attached Documents ({activeConsultation.documents.length})
                    </h5>
                    <div className="space-y-1.5">
                      {activeConsultation.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-hairline hover:border-brass cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-brass shrink-0" />
                            <span className="truncate text-primary font-medium">{doc.name}</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeConsultation.intakeBrief && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      Initial Intake Summary
                    </h5>
                    <div className="p-3 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-on-surface-variant leading-relaxed max-h-32 overflow-y-auto">
                      {activeConsultation.intakeBrief}
                    </div>
                  </div>
                )}

                {role !== "lawyer" ? (
                  <Link
                    href={`/lawyers/${activeConsultation.lawyer.id}`}
                    className="block w-full py-2.5 rounded-lg border border-primary text-primary text-xs font-semibold text-center hover:bg-surface-container-low transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    View Lawyer Profile
                  </Link>
                ) : (
                  <Link
                    href="/cases"
                    className="block w-full py-2.5 rounded-lg bg-primary text-white text-xs font-semibold text-center hover:bg-slate-dark transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Open in Case Management
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Consultation Picker Modal (Native Bottom Sheet on Mobile) */}
      {showNewConsultationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl border-t sm:border border-hairline shadow-editorial w-full max-w-md max-h-[85dvh] flex flex-col p-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Sheet Drag Handle */}
            <div className="sm:hidden w-10 h-1 bg-outline-variant/60 rounded-full mx-auto mb-3 shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-brass" />
                <h3 className="font-headline text-base font-semibold text-primary">Start a New Conversation</h3>
              </div>
              <button
                onClick={() => setShowNewConsultationModal(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mt-2 mb-4">
              Select a verified lawyer to start a private chat:
            </p>

            <div className="space-y-2 overflow-y-auto pr-1">
              {allLawyersList.map((lawyer) => (
                <div
                  key={lawyer.id}
                  onClick={() => handleStartConsultationWithLawyer(lawyer)}
                  className="p-3 rounded-xl bg-surface-container-lowest border border-hairline hover:border-brass hover:bg-surface-container-low/80 transition-all cursor-pointer flex items-center gap-3"
                >
                  <img
                    src={lawyer.avatar}
                    alt={lawyer.name}
                    className="w-11 h-11 rounded-full object-cover border border-hairline shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-primary truncate">{lawyer.name}</h4>
                    <span className="text-[11px] text-on-surface-variant truncate block">{lawyer.title}</span>
                    <span className="text-[10px] text-brass font-semibold">{lawyer.jurisdiction} • ₹{lawyer.hourlyRate.toLocaleString("en-IN")}/hr</span>
                  </div>
                  <Plus className="w-4 h-4 text-brass shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Privileged WebRTC Video Consultation Room */}
      {activeCallModal === "video" && activeConsultation && (
        <VideoConsultationRoom
          matterId={activeMatterId}
          caseTitle={activeConsultation.caseTitle}
          counterpartName={
            role === "lawyer"
              ? (activeConsultation.clientName || currentUser.name)
              : activeConsultation.lawyer.name
          }
          onClose={() => setActiveCallModal(null)}
        />
      )}

      {/* Real WebRTC Audio-Only Call (replaces fake phone modal) */}
      {activeCallModal === "phone" && activeConsultation && (
        <VideoConsultationRoom
          matterId={activeMatterId}
          caseTitle={activeConsultation.caseTitle}
          counterpartName={
            role === "lawyer"
              ? (activeConsultation.clientName || currentUser.name)
              : activeConsultation.lawyer.name
          }
          onClose={() => setActiveCallModal(null)}
          audioOnly={true}
        />
      )}

      {/* Evidentiary Document Preview Modal (Native Bottom Sheet on Mobile) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl border-t sm:border border-hairline shadow-editorial w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:fade-in duration-200">
            {/* Mobile Sheet Drag Handle */}
            <div className="sm:hidden w-10 h-1 bg-outline-variant/60 rounded-full mx-auto my-2.5 shrink-0" />
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-brass" />
                <div>
                  <h4 className="text-xs font-semibold text-primary">{previewDoc.name}</h4>
                  <span className="text-[10px] text-on-surface-variant">
                    {previewDoc.size} • {previewDoc.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-surface-container-low space-y-4 font-serif text-xs sm:text-sm leading-relaxed text-on-surface border-b border-hairline">
              <div className="text-center font-bold text-sm tracking-wide uppercase border-b border-hairline pb-2 font-sans">
                DOCUMENT PREVIEW
              </div>

              {previewDoc.sha256Hash && (
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-emerald-500/30 font-sans text-xs flex items-center gap-2.5 text-primary">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold block text-[11px] uppercase tracking-wide text-emerald-700">Verified Confidential Document</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      Encrypted and stored securely for private attorney review
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-on-surface-variant italic font-sans">
                Confidential Document • Protected by Attorney-Client Privilege
              </p>
              <div className="bg-surface-container p-2.5 border-l-4 border-brass rounded text-xs font-sans">
                <strong>Privacy Status:</strong> Protected under Attorney-Client Privilege.
              </div>
              <p>
                <strong>Summary of Document Contents:</strong> This document was uploaded confidentially to your case file for attorney review. You can download the original file using the button below.
              </p>
            </div>

            <div className="p-3.5 bg-surface flex items-center justify-between shrink-0">
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brass" />
                <span>Confidential File</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-1.5 rounded-lg border border-hairline text-xs font-semibold text-primary hover:bg-surface-container min-h-[36px]"
                >
                  Close
                </button>
                {previewDoc.downloadUrl ? (
                  <a
                    href={previewDoc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={previewDoc.name}
                    className="bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs min-h-[36px]"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      alert(`Downloading ${previewDoc.name}`);
                      setPreviewDoc(null);
                    }}
                    className="bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs min-h-[36px]"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading messages...</div>}>
      <MessagesView />
    </Suspense>
  );
}
