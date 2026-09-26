"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Users,
  AlertCircle,
  FileText,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/context/RoleContext";

interface VideoConsultationRoomProps {
  matterId: string;
  caseTitle: string;
  counterpartName: string;
  onClose: () => void;
  audioOnly?: boolean; // When true, runs as phone call (no camera)
}

export function VideoConsultationRoom({
  matterId,
  caseTitle,
  counterpartName,
  onClose,
  audioOnly = false,
}: VideoConsultationRoomProps) {
  const { currentUserId, role } = useUserRole();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(audioOnly);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");
  const [participantCount, setParticipantCount] = useState(1);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Call duration timer when connected
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (connectionStatus === "connected" && participantCount === 2) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [connectionStatus, participantCount]);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    // Use a different channel name for audio-only to avoid cross-modal interference
    const channelName = `consultation-${audioOnly ? "audio" : "video"}-${matterId}`;
    const channel = supabase.channel(channelName);

    // ICE Servers: STUN + OpenRelay TURN (free, no credentials needed)
    // OpenRelay is metered.ca's public free TURN service for early-stage apps.
    // Upgrade to a credentialed metered.ca account (50GB free) when you grow.
    const rtcConfig: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turns:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    };

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Remote track listener
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        if (audioOnly) {
          // For audio-only mode, play through a hidden <audio> element
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        } else {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
        if (isMounted) {
          setConnectionStatus("connected");
          setParticipantCount(2);
        }
      }
    };

    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      if (!isMounted) return;
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        setConnectionStatus("failed");
      } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setConnectionStatus("connected");
      }
    };

    // Send ICE candidates via Supabase Realtime channel
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate, senderId: currentUserId },
        });
      }
    };

    // Initialize Local Media Stream
    async function startMedia() {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("WebRTC media devices not supported in this browser");
        }

        const constraints = audioOnly
          ? { audio: true, video: false }
          : { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isMounted) return;

        localStreamRef.current = stream;
        if (!audioOnly && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        if (isMounted) setConnectionStatus("connected");

        // Broadcast peer-joined so any existing peer in the room can initiate an offer
        channel.send({
          type: "broadcast",
          event: "peer-joined",
          payload: { senderId: currentUserId, role },
        });

        // Client always initiates the offer
        if (role === "client") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "sdp-offer",
            payload: { offer, senderId: currentUserId },
          });
        }
      } catch (err: any) {
        console.warn("Camera/Mic access not granted or unavailable:", err.message);
        if (isMounted) {
          setPermissionError(
            audioOnly
              ? "Microphone access not granted. Please allow microphone access and rejoin."
              : "Camera/Microphone access not granted. Running in secure preview mode."
          );
          setConnectionStatus("connected");
        }
      }
    }

    // Realtime Signaling Listeners
    channel
      .on("broadcast", { event: "peer-joined" }, async ({ payload }) => {
        if (payload?.senderId !== currentUserId && pc.signalingState !== "closed") {
          try {
            if (isMounted) setParticipantCount(2);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({
              type: "broadcast",
              event: "sdp-offer",
              payload: { offer, senderId: currentUserId },
            });
          } catch (e) {
            console.error("Failed to initiate WebRTC offer on peer-joined:", e);
          }
        }
      })
      .on("broadcast", { event: "sdp-offer" }, async ({ payload }) => {
        if (payload.senderId !== currentUserId && pc.signalingState !== "closed") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: "broadcast",
              event: "sdp-answer",
              payload: { answer, senderId: currentUserId },
            });
            if (isMounted) setParticipantCount(2);
          } catch (e) {
            console.error("Failed to handle WebRTC SDP offer:", e);
          }
        }
      })
      .on("broadcast", { event: "sdp-answer" }, async ({ payload }) => {
        if (payload.senderId !== currentUserId && pc.signalingState !== "closed") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            if (isMounted) setParticipantCount(2);
          } catch (e) {
            console.error("Failed to handle WebRTC SDP answer:", e);
          }
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (payload.senderId !== currentUserId && pc.signalingState !== "closed") {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.error("Failed to add ICE candidate:", e);
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          startMedia();
        }
      });

    return () => {
      isMounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pc.close();
      supabase.removeChannel(channel);
    };
  }, [matterId, currentUserId, role, audioOnly]);

  // Audio mute toggle
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Video track toggle
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Screen share toggle for legal contract redlines
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const videoTrack = displayStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const originalTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && originalTrack) {
        sender.replaceTrack(originalTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  // ─── AUDIO-ONLY (Phone Call) UI ───────────────────────────────────────
  if (audioOnly) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        {/* Hidden audio element for remote stream playback */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="bg-surface rounded-t-2xl sm:rounded-2xl border-t sm:border border-hairline shadow-editorial w-full max-w-md flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-hairline flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-brass" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Encrypted Audio Call</h4>
                <span className="text-[10px] text-on-surface-variant">WebRTC • End-to-End Encrypted</span>
              </div>
            </div>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              connectionStatus === "connected" && participantCount === 2
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : connectionStatus === "failed"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {connectionStatus === "connected" && participantCount === 2 ? "Connected" : connectionStatus === "failed" ? "Failed" : "Connecting..."}
            </div>
          </div>

          {/* Body */}
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-surface-container-low border-2 flex items-center justify-center text-2xl font-bold text-primary ${
                connectionStatus === "connected" && participantCount === 2 ? "border-emerald-400 animate-pulse" : "border-hairline"
              }`}>
                {counterpartName.slice(0, 2).toUpperCase()}
              </div>
              {connectionStatus === "connected" && participantCount === 2 && (
                <span className="absolute bottom-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              )}
            </div>

            <div>
              <h3 className="font-bold text-lg text-primary">{counterpartName}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{caseTitle}</p>
            </div>

            {connectionStatus === "connected" && participantCount === 2 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-3 text-center">
                <span className="text-xs font-bold text-emerald-800 block uppercase tracking-wider">Call Connected</span>
                <span className="text-2xl font-mono font-bold text-emerald-900 mt-1 block">{formatDuration(callDuration)}</span>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1,2,3,4,5].map((_, i) => (
                    <span key={i} className="w-1 bg-emerald-500 rounded-full animate-pulse" style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              </div>
            ) : connectionStatus === "failed" ? (
              <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-3 text-center">
                <span className="text-xs font-bold text-red-800 block">Connection Failed</span>
                <p className="text-[11px] text-red-600 mt-1">Check your internet connection and try again.</p>
              </div>
            ) : (
              <div className="bg-surface-container-low border border-hairline rounded-xl px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-brass animate-ping" />
                  <span>Waiting for {counterpartName} to connect...</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1.5">Share the meeting link or have them open Messages to join.</p>
              </div>
            )}

            {permissionError && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{permissionError}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-surface-container-lowest border-t border-hairline flex items-center justify-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3.5 rounded-full transition-all ${
                isAudioMuted
                  ? "bg-red-500/20 text-red-500 border border-red-500/40"
                  : "bg-surface-container text-primary border border-hairline hover:bg-surface-container-low"
              }`}
              title={isAudioMuted ? "Unmute" : "Mute"}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIDEO CALL UI ─────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#070D1E] text-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0B132B]/80 backdrop-blur-md border-b border-hairline/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brass/20 flex items-center justify-center text-brass border border-brass/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brass">
                Advocato Privileged Room
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "failed" ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
            </div>
            <h2 className="font-headline text-base font-semibold text-white truncate max-w-md">
              {caseTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {participantCount === 2 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/90 font-mono">
              {formatDuration(callDuration)}
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/90">
            <Users className="w-3.5 h-3.5 text-brass" />
            <span>{participantCount === 2 ? `In consultation with ${counterpartName}` : "Waiting for counsel..."}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      {permissionError && (
        <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Video Feeds Area */}
      <div className="flex-1 relative p-4 md:p-6 flex items-center justify-center gap-4 overflow-hidden">
        {/* Main Remote Video */}
        <div className="relative w-full h-full max-w-5xl rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-2xl">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {participantCount < 2 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0B132B]/80 to-[#070D1E] p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-brass/10 border-2 border-brass/40 flex items-center justify-center text-brass font-bold text-2xl animate-pulse">
                {counterpartName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-white">{counterpartName}</h3>
                <p className="text-xs text-white/60 mt-1 max-w-sm">
                  The encrypted connection is ready. Counsel will appear once they enter the privileged session.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-brass">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>End-to-End Encrypted WebRTC Session + TURN Relay</span>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium border border-white/10">
            {counterpartName} {participantCount === 2 ? "(Live)" : "(Awaiting)"}
          </div>
        </div>

        {/* Local Video PiP */}
        <div className="absolute bottom-8 right-8 w-44 sm:w-56 aspect-video rounded-xl overflow-hidden bg-black/80 border-2 border-brass/40 shadow-2xl z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B132B] text-white/60">
              <VideoOff className="w-6 h-6 mb-1 text-white/40" />
              <span className="text-[10px]">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-medium">
            You ({role === "lawyer" ? "Lead Counsel" : "Client"})
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="px-6 py-5 bg-[#0B132B]/90 backdrop-blur-md border-t border-hairline/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
          <FileText className="w-3.5 h-3.5 text-brass" />
          <span>Screen share available for contract redlines &amp; exhibits</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-full transition-all ${
              isAudioMuted
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
            title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-all ${
              isVideoOff
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
            title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-all ${
              isScreenSharing
                ? "bg-brass text-white shadow-lg"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen for Agreement Review"}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg hover:scale-105"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Consultation</span>
          </button>
        </div>

        <div className="text-[11px] text-white/50">
          {participantCount === 2 ? formatDuration(callDuration) : "Waiting..."}
        </div>
      </div>
    </div>
  );
}
