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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/context/RoleContext";

interface VideoConsultationRoomProps {
  matterId: string;
  caseTitle: string;
  counterpartName: string;
  onClose: () => void;
}

export function VideoConsultationRoom({
  matterId,
  caseTitle,
  counterpartName,
  onClose,
}: VideoConsultationRoomProps) {
  const { currentUserId, role } = useUserRole();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");
  const [participantCount, setParticipantCount] = useState(1);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    const channelName = `consultation-video-${matterId}`;
    const channel = supabase.channel(channelName);

    // ICE Servers (Standard free Google STUN servers)
    const rtcConfig: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Remote track listener
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus("connected");
        setParticipantCount(2);
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

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!isMounted) return;

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        setConnectionStatus("connected");

        // Broadcast peer-joined so any existing peer in the room can initiate an offer
        channel.send({
          type: "broadcast",
          event: "peer-joined",
          payload: { senderId: currentUserId, role },
        });

        // Also initiate an offer if client
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
        setPermissionError(
          "Camera/Microphone access not granted. Running in secure audio/video preview mode."
        );
        setConnectionStatus("connected");
      }
    }

    // Realtime Signaling Listeners
    channel
      .on("broadcast", { event: "peer-joined" }, async ({ payload }) => {
        if (payload?.senderId !== currentUserId && pc.signalingState !== "closed") {
          try {
            setParticipantCount(2);
            // Initiate offer to the newly joined peer
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
            setParticipantCount(2);
          } catch (e) {
            console.error("Failed to handle WebRTC SDP offer:", e);
          }
        }
      })
      .on("broadcast", { event: "sdp-answer" }, async ({ payload }) => {
        if (payload.senderId !== currentUserId && pc.signalingState !== "closed") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setParticipantCount(2);
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
      // Clean up tracks
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pc.close();
      supabase.removeChannel(channel);
    };
  }, [matterId, currentUserId, role]);

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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="font-headline text-base font-semibold text-white truncate max-w-md">
              {caseTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/90">
            <Users className="w-3.5 h-3.5 text-brass" />
            <span>{participantCount === 2 ? `In consultation with ${counterpartName}` : "Waiting for counsel to connect..."}</span>
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

      {/* Permission Notice if hardware not available */}
      {permissionError && (
        <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Video Feeds Area */}
      <div className="flex-1 relative p-4 md:p-6 flex items-center justify-center gap-4 overflow-hidden">
        {/* Main Remote Video (Counterpart) */}
        <div className="relative w-full h-full max-w-5xl rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-2xl">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Remote Placeholder when waiting */}
          {participantCount < 2 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0B132B]/80 to-[#070D1E] p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-brass/10 border-2 border-brass/40 flex items-center justify-center text-brass font-bold text-2xl animate-pulse">
                {counterpartName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-white">
                  {counterpartName}
                </h3>
                <p className="text-xs text-white/60 mt-1 max-w-sm">
                  The encrypted connection is ready. Counsel will appear once they enter the privileged session.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-brass">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>End-to-End Encrypted WebRTC Session</span>
              </div>
            </div>
          )}

          {/* Remote Label */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium border border-white/10">
            {counterpartName} {participantCount === 2 ? "(Live)" : "(Awaiting)"}
          </div>
        </div>

        {/* Local Video Picture-in-Picture (Self) */}
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
          <span>Screen share available for contract redlines & exhibits</span>
        </div>

        {/* Central Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute Button */}
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

          {/* Camera Button */}
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

          {/* Screen Share Button */}
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

          {/* End Call Button */}
          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg hover:scale-105"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Consultation</span>
          </button>
        </div>

        <div className="text-[11px] text-white/50">
          Advocato Encrypted Telehealth Engine
        </div>
      </div>
    </div>
  );
}
