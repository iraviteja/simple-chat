import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "./socket";
import type { MessageData, TypingData, VideoCallData } from "./socket";

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
        console.log("Socket connected to server");
        setOnlineUsers((prev) => new Set(prev).add(user._id));
      });

      newSocket.on("initial-online-users", (users: string[]) => {
        console.log("Received initial online users:", users);
        setOnlineUsers(new Set(users));
      });

      newSocket.on("user-online", (userId: string) => {
        console.log("User came online:", userId);
        setOnlineUsers((prev) => new Set(prev).add(userId));
      });

      newSocket.on("user-offline", (userId: string) => {
        console.log("User went offline:", userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Video call event logging
      newSocket.on("incoming-call", (data: any) => {
        console.log("Received incoming call event:", data);
      });

      newSocket.on("call-answered", (data: any) => {
        console.log("Received call answer event:", data);
      });

      newSocket.on("ice-candidate", (data: any) => {
        console.log("Received ICE candidate event:", data);
      });

      newSocket.on("call-ended", (data: any) => {
        console.log("Received call end event:", data);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected from server");
      });

      newSocket.on("reconnect", () => {
        console.log("Socket reconnected to server");
        setOnlineUsers((prev) => new Set(prev).add(user._id));
      });

      newSocket.on("error", (error: any) => {
        console.error("Socket error:", error);
      });

      setSocket(newSocket);

      return () => {
        console.log("Cleaning up socket connection");
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

  const initiateCall = (data: VideoCallData) => {
    if (socket) {
      console.log("Emitting call-user event:", data);
      socket.emit("call-user", data);
    } else {
      console.error("Cannot initiate call: socket not connected");
    }
  };

  const answerCall = (data: VideoCallData) => {
    if (socket) {
      console.log("Emitting call-answer event:", data);
      socket.emit("call-answer", data);
    } else {
      console.error("Cannot answer call: socket not connected");
    }
  };

  const sendIceCandidate = (data: VideoCallData) => {
    if (socket) {
      console.log("Emitting ice-candidate event:", data);
      socket.emit("ice-candidate", data);
    } else {
      console.error("Cannot send ICE candidate: socket not connected");
    }
  };

  const endCall = (data: { to: string }) => {
    if (socket) {
      console.log("Emitting end-call event:", data);
      socket.emit("end-call", data);
    } else {
      console.error("Cannot end call: socket not connected");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers: onlineUsers as Set<string>,
        sendMessage,
        typing,
        stopTyping,
        initiateCall,
        answerCall,
        sendIceCandidate,
        endCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
