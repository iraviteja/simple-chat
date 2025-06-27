import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "./socket";
import type { MessageData, TypingData } from "./socket";

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user?._id) {
      const socketURL =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";
      const newSocket = io(socketURL.replace(/\/$/, ""), {
        auth: { token },
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        console.log("Connected to server");
        // Add self to online users
        setOnlineUsers((prev) => new Set(prev).add(user._id));
      });

      newSocket.on("initial-online-users", (users: string[]) => {
        setOnlineUsers(new Set(users));
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

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      newSocket.on("reconnect", () => {
        console.log("Reconnected to server");
        // Add self back to online users after reconnect
        setOnlineUsers((prev) => new Set(prev).add(user._id));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user?._id]);

  const sendMessage = (data: MessageData) => {
    if (socket) {
      socket.emit("send-message", data);
    }
  };

  const typing = (data: TypingData) => {
    if (socket) {
      socket.emit("typing", data);
    }
  };

  const stopTyping = (data: TypingData) => {
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
