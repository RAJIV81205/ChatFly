"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import ChatList from "./ChatList";
import ChatWindow from "./Window/ChatWindow";
import ZegoCallPopup from "@/components/Calls/ZegoCallPopup";
import { getTokenForSocket } from "@/lib/utils/auth";
import { useSocket } from "@/lib/hooks/useSocket";
import toast from "react-hot-toast";
import { PhoneOff, Phone, VolumeX } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  username: string;
  profilePicUrl: string | null;
  lastSeen?: string;
  bio?: string;
  createdAt?: string;
}

const ChatInterface = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    roomId: string;
    callerName?: string;
    callerProfilePic?: string | null;
    callerUsername?: string;
  } | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<{
    receiverId: string;
    roomId: string;
    receiverName?: string;
  } | null>(null);
  const [callTimer, setCallTimer] = useState<number>(30);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper function to stop ringtone
  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // Helper function to clear all timers
  const clearAllTimers = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Global socket connection for receiving calls
  const { isConnected, acceptCall, rejectCall, endCall, initiateCall } =
    useSocket({
      token: token || undefined,
      onIncomingCall:({ callerId, roomId }) => {
  

        // Get caller info if possible
         fetchCallerInfo(callerId).then((callerInfo) => {
          console.log("👤 Caller info fetched:", callerInfo);
          setIncomingCall({
            callerId,
            roomId,
            callerName: callerInfo.fullName,
            callerProfilePic: callerInfo.profilePicUrl,
            callerUsername: callerInfo.username,
          });

          // Set 30-second timeout for incoming call
          clearAllTimers();

          // Reset timer
          setCallTimer(30);

           // Play notification sound
        try {
          // Stop any existing audio
          stopRingtone();

          const audio = new Audio(
            "https://cdn.pixabay.com/audio/2025/11/16/audio_a8d8fa395c.mp3"
          );
          audioRef.current = audio;
          audio.loop = true; // Loop the ringtone
          audio.volume = 0.7; // Set volume to 70%
          audio.play().catch((e) => {
            console.log("Could not play notification sound:", e);
          });
        } catch (e) {
          console.log("Audio notification not available:", e);
        }

          // Start countdown timer
          callTimerRef.current = setInterval(() => {
            setCallTimer((prev) => {
              if (prev <= 1) {
                if (callTimerRef.current) {
                  clearInterval(callTimerRef.current);
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          callTimeoutRef.current = setTimeout(() => {
            console.log("⏰ Incoming call timed out");

            // Stop ringtone and clear timers
            stopRingtone();

            setIncomingCall(null);
            setCallTimer(30);
            if (callTimerRef.current) {
              clearInterval(callTimerRef.current);
            }
            // The caller will be notified via onCallTimeout
          }, 30000);
        });

       
      },
      onCallAccepted: ({ roomId }) => {
        console.log("Call accepted globally, joining room:", roomId);

        // Stop ringtone and clear timers
        stopRingtone();
        clearAllTimers();

        // Clear outgoing call state and show call interface
        setOutgoingCall(null);
        setActiveRoom(roomId);
        setShowCall(true);
        setIncomingCall(null);

        // Dismiss any existing toasts
        toast.dismiss();
      },
      onCallRejected: () => {
        console.log("Call rejected globally");

        // Stop ringtone and clear timers
        stopRingtone();
        clearAllTimers();

        setIncomingCall(null);
        setOutgoingCall(null);
        toast.dismiss();
        toast.error("Call declined");
      },
      onCallEnded: () => {
        console.log("Call ended globally");

        // Stop ringtone and clear timers
        stopRingtone();
        clearAllTimers();

        setShowCall(false);
        setActiveRoom(null);
        setIncomingCall(null);
        setOutgoingCall(null);
        setCallTimer(30);
        toast.dismiss();
      },
      onCallFailed: ({ reason }) => {
        console.log("Call failed globally:", reason);

        // Stop ringtone and clear timers
        stopRingtone();
        clearAllTimers();

        setShowCall(false);
        setActiveRoom(null);
        setIncomingCall(null);
        setOutgoingCall(null);
        setCallTimer(30);
        toast.dismiss();
        toast.error(`Call failed: ${reason}`);
      },
    });

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      clearAllTimers();
      stopRingtone();
    };
  }, []);

  useEffect(() => {
    // Get JWT token for WebSocket authentication
    const fetchToken = async () => {
      const authToken = await getTokenForSocket();
      setToken(authToken);
      console.log("🔌 Token fetched for global socket:", !!authToken);
    };

    fetchToken();

    // Get current user info from the chats API
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const username = localStorage.getItem("username");
    try {
      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchCallerInfo = async (
    callerId: string
  ): Promise<{
    fullName: string;
    username: string;
    profilePicUrl: string | null;
  }> => {
    try {
      const response = await fetch(`/api/users/by-id/${callerId}`);
      const data = await response.json();
      return data.success
        ? {
            fullName: data.user.fullName || data.user.username,
            username: data.user.username,
            profilePicUrl: data.user.profilePicUrl,
          }
        : {
            fullName: callerId,
            username: callerId,
            profilePicUrl: null,
          };
    } catch (error) {
      console.error("Error fetching caller info:", error);
      return {
        fullName: callerId,
        username: callerId,
        profilePicUrl: null,
      };
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleCloseCall = useCallback(() => {
    console.log("Closing call globally...");

    // Notify other participants that call ended
    if (activeRoom) {
      endCall(activeRoom, []);
    }

    setShowCall(false);
    setActiveRoom(null);
  }, [activeRoom, endCall]);

  return (
    <>
      <div className="flex h-full">
        <ChatList
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChatId}
        />

        {currentUser && token && (
          <ChatWindow
            chatId={selectedChatId}
            currentUserId={currentUser.id}
            token={token}
            globalSocketInstance={{
              isConnected,
              acceptCall,
              rejectCall,
              endCall,
              initiateCall,
            }}
          />
        )}
      </div>

      {/* Global Incoming Call Modal */}
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fadeIn">
          <div className="w-96 max-w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-700 animate-slideUp">
            {/* Caller Image */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {incomingCall.callerProfilePic ? (
                  <Image
                    src={incomingCall.callerProfilePic}
                    alt={incomingCall.callerName || "Caller"}
                    width={90}
                    height={90}
                    className="rounded-full border-4 border-emerald-500 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-emerald-400 shadow-xl">
                    {(incomingCall.callerName || incomingCall.callerId)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {/* Pulsing Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-70"></div>
              </div>

              {/* Caller details */}
              <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
                Incoming Call
              </h2>

              <p className="mt-1 text-lg font-medium text-gray-700 dark:text-gray-200">
                {incomingCall.callerName || incomingCall.callerId}
              </p>

              {incomingCall.callerUsername && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{incomingCall.callerUsername}
                </p>
              )}

              {/* Connection status */}
              <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </span>

              {/* Timer */}
              <div className="mt-3 flex justify-center items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all 
            ${callTimer <= 10 ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}
                >
                  {callTimer}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  seconds left
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center items-center gap-10 mt-6">
              {/* Reject */}
              <button
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 text-white"
                onClick={() => {
                  stopRingtone();
                  clearAllTimers();
                  rejectCall(incomingCall.roomId, incomingCall.callerId);
                  setIncomingCall(null);
                  setCallTimer(30);
                }}
                title="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              {/* Mute Ringtone */}
              <button
                className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 text-gray-800 dark:text-gray-200"
                onClick={() => {
                  stopRingtone();
                }}
                title="Mute Ringtone"
              >
                <VolumeX className="w-6 h-6" />
              </button>

              {/* Accept */}
              <button
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 text-white"
                onClick={() => {
                  stopRingtone();
                  clearAllTimers();
                  acceptCall(incomingCall.roomId, incomingCall.callerId);
                  setActiveRoom(incomingCall.roomId);
                  setShowCall(true);
                  setIncomingCall(null);
                  setCallTimer(30);
                }}
                title="Accept Call"
              >
                <Phone className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Call Popup */}
      {showCall && activeRoom && currentUser && (
        <ZegoCallPopup
          roomId={activeRoom}
          userId={currentUser.id}
          userName = {currentUser.fullName || currentUser.username}
          onClose={handleCloseCall}
        />
      )}
    </>
  );
};

export default ChatInterface;
