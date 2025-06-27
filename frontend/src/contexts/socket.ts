import { createContext } from "react";
import { Socket } from "socket.io-client";

export interface MessageData {
  content: string;
  receiver?: string;
  group?: string;
  replyTo?: string;
  type?: "text" | "image" | "pdf" | "video";
}

export interface TypingData {
  receiver?: string;
  group?: string;
}

export interface VideoCallData {
  to: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  sendMessage: (data: MessageData) => void;
  typing: (data: TypingData) => void;
  stopTyping: (data: TypingData) => void;
  initiateCall: (data: VideoCallData) => void;
  answerCall: (data: VideoCallData) => void;
  sendIceCandidate: (data: VideoCallData) => void;
  endCall: (data: { to: string }) => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);
