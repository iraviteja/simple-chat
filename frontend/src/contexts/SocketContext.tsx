import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  sendMessage: (data: any) => void;
  typing: (data: { receiver?: string; group?: string }) => void;
  stopTyping: (data: { receiver?: string; group?: string }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      const socketURL =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";
      const newSocket = io(socketURL.replace(/\/$/, ""), {
        auth: { token },
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("Connected to server");
      });

      newSocket.on("user-online", (userId: string) => {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      });

      newSocket.on("user-offline", (userId: string) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  const sendMessage = (data: any) => {
    if (socket) {
      socket.emit("send-message", data);
    }
  };

  const typing = (data: { receiver?: string; group?: string }) => {
    if (socket) {
      socket.emit("typing", data);
    }
  };

  const stopTyping = (data: { receiver?: string; group?: string }) => {
    if (socket) {
      socket.emit("stop-typing", data);
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, sendMessage, typing, stopTyping }}
    >
      {children}
    </SocketContext.Provider>
  );
};
