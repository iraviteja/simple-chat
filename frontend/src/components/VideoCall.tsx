import { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import type { User } from "../types";
import { Video, Phone, Mic, MicOff, VideoOff, X } from "lucide-react";

interface VideoCallProps {
  otherUser: User;
  onClose: () => void;
  isIncoming?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  otherUser,
  onClose,
  isIncoming = false,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const {
    socket,
    initiateCall,
    answerCall,
    sendIceCandidate,
    endCall: socketEndCall,
  } = useSocket();

  const initializePeerConnection = () => {
    console.log("Initializing peer connection");
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local tracks to the peer connection
    if (localStream) {
      console.log("Adding local tracks to peer connection");
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log("Received remote track", event.streams[0]);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Set up ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate", event.candidate);
        sendIceCandidate({
          to: otherUser._id,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.log("Attempting ICE restart");
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log("Signaling state:", pc.signalingState);
    };

    return pc;
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async (data: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      if (data.from === otherUser._id) {
        console.log("Handling incoming call", data);
        const pc = initializePeerConnection();
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("Created and set local answer", answer);
          answerCall({
            to: otherUser._id,
            answer,
          });
          setIsCallActive(true);
        } catch (error) {
          console.error("Error handling incoming call:", error);
        }
      }
    };

    const handleCallAnswer = async (data: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (data.from === otherUser._id && peerConnectionRef.current) {
        console.log("Handling call answer", data);
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setIsCallActive(true);
        } catch (error) {
          console.error("Error handling call answer:", error);
        }
      }
    };

    const handleIceCandidate = async (data: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (data.from === otherUser._id && peerConnectionRef.current) {
        try {
          console.log("Adding received ICE candidate", data.candidate);
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    const handleCallEnd = (data: { from: string }) => {
      if (data.from === otherUser._id) {
        endCall();
      }
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnd);

    // If not incoming call, initialize peer connection
    if (!isIncoming) {
      console.log("Initializing outgoing call");
      initializePeerConnection();
    }

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnd);
    };
  }, [
    socket,
    otherUser._id,
    localStream,
    isIncoming,
    answerCall,
    sendIceCandidate,
  ]);

  useEffect(() => {
    const startLocalStream = async () => {
      try {
        console.log("Requesting user media");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Got local stream", stream);
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // If not incoming call, start the call automatically
        if (!isIncoming && stream) {
          await startCall();
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    startLocalStream();

    return () => {
      console.log("Cleaning up local stream");
      localStream?.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
    };
  }, [isIncoming]);

  const startCall = async () => {
    if (!socket || !peerConnectionRef.current || !localStream) {
      console.error(
        "Cannot start call: missing socket, peer connection, or local stream"
      );
      return;
    }

    try {
      console.log("Creating offer for call");
      const pc = peerConnectionRef.current;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Created and set local offer", offer);

      initiateCall({
        to: otherUser._id,
        offer,
      });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const endCall = () => {
    console.log("Ending call");
    socketEndCall({ to: otherUser._id });

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    onClose();
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isIncoming ? "Incoming Call" : "Video Call"} with {otherUser.name}
          </h3>
          <button
            onClick={endCall}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative h-[600px] bg-gray-900 rounded-lg overflow-hidden">
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {localStream && (
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioEnabled
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoEnabled
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </button>

          {!isCallActive && isIncoming && (
            <button
              onClick={startCall}
              className="p-3 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
          )}

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
