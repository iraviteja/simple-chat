import { createContext } from "react";
import { Socket } from "socket.io-client";

export interface MessageData {
  receiver?: string;
  group?: string;
  content?: string;
  type?: string;
  fileData?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
  };
}

export interface TypingData {
  receiver?: string;
  group?: string;
}

export interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  sendMessage: (data: MessageData) => void;
  typing: (data: TypingData) => void;
  stopTyping: (data: TypingData) => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);
