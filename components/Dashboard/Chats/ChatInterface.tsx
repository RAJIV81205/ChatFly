"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import ChatList from "./ChatList";
import ChatWindow from "./Window/ChatWindow";
import ZegoCallPopup from "@/components/Calls/ZegoCallPopup";
import { getTokenForSocket } from "@/lib/utils/auth";
import { useSocket } from "@/lib/hooks/useSocket";
import toast from "react-hot-toast";

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

  // Global socket connection for receiving calls
  const {
    isConnected,
    acceptCall,
    rejectCall,
    endCall,
    initiateCall,
  } = useSocket({
    token: token || undefined,
    onIncomingCall: ({ callerId, roomId }) => {
      console.log("🔔 Global incoming call received:", { callerId, roomId });
      
      // Play notification sound
      try {
        const audio = new Audio('/sounds/incoming-call.mp3');
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        console.log('Audio notification not available:', e);
      }
      
      // Get caller info if possible
      fetchCallerInfo(callerId).then((callerInfo) => {
        console.log("👤 Caller info fetched:", callerInfo);
        setIncomingCall({ 
          callerId, 
          roomId, 
          callerName: callerInfo.fullName,
          callerProfilePic: callerInfo.profilePicUrl,
          callerUsername: callerInfo.username
        });
      });
    },
    onCallAccepted: ({ roomId }) => {
      console.log("Call accepted globally, joining room:", roomId);
      setActiveRoom(roomId);
      setShowCall(true);
      setIncomingCall(null);
    },
    onCallRejected: () => {
      console.log("Call rejected globally");
      setIncomingCall(null);
      toast.error("Call rejected");
    },
    onCallEnded: () => {
      console.log("Call ended globally");
      setShowCall(false);
      setActiveRoom(null);
    },
    onCallFailed: ({ reason }) => {
      console.log("Call failed globally:", reason);
      setShowCall(false);
      setActiveRoom(null);
      toast.error(`Call failed: ${reason}`);
    },
  });

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

  const fetchCallerInfo = async (callerId: string): Promise<{
    fullName: string;
    username: string;
    profilePicUrl: string | null;
  }> => {
    try {
      const response = await fetch(`/api/users/by-id/${callerId}`);
      const data = await response.json();
      return data.success ? {
        fullName: data.user.fullName || data.user.username,
        username: data.user.username,
        profilePicUrl: data.user.profilePicUrl
      } : {
        fullName: callerId,
        username: callerId,
        profilePicUrl: null
      };
    } catch (error) {
      console.error("Error fetching caller info:", error);
      return {
        fullName: callerId,
        username: callerId,
        profilePicUrl: null
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
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl w-96 text-center">
            {/* Caller Profile Picture */}
            <div className="mb-6">
              {incomingCall.callerProfilePic ? (
                <div className="relative">
                  <Image
                    src={incomingCall.callerProfilePic}
                    alt={incomingCall.callerName || "Caller"}
                    width={80}
                    height={80}
                    className="rounded-full mx-auto border-4 border-emerald-500 shadow-lg"
                  />
                  {/* Pulsing ring animation */}
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-500 shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {(incomingCall.callerName || incomingCall.callerId).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Pulsing ring animation */}
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75"></div>
                </div>
              )}
            </div>

            {/* Call Info */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Incoming Video Call
              </h2>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">
                {incomingCall.callerName || incomingCall.callerId}
              </p>
              {incomingCall.callerUsername && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  @{incomingCall.callerUsername}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <button
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                onClick={() => {
                  console.log("Reject button clicked globally:", incomingCall);
                  rejectCall(incomingCall.roomId, incomingCall.callerId);
                  setIncomingCall(null);
                }}
                title="Decline Call"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.79 15.41C20.74 13.24 20.74 10.76 19.79 8.59L22.5 5.88C22.89 5.49 22.89 4.86 22.5 4.47L19.53 1.5C19.14 1.11 18.51 1.11 18.12 1.5L15.41 4.21C13.24 3.26 10.76 3.26 8.59 4.21L5.88 1.5C5.49 1.11 4.86 1.11 4.47 1.5L1.5 4.47C1.11 4.86 1.11 5.49 1.5 5.88L4.21 8.59C3.26 10.76 3.26 13.24 4.21 15.41L1.5 18.12C1.11 18.51 1.11 19.14 1.5 19.53L4.47 22.5C4.86 22.89 5.49 22.89 5.88 22.5L8.59 19.79C10.76 20.74 13.24 20.74 15.41 19.79L18.12 22.5C18.51 22.89 19.14 22.89 19.53 22.5L22.5 19.53C22.89 19.14 22.89 18.51 22.5 18.12L19.79 15.41Z"/>
                </svg>
              </button>

              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                onClick={() => {
                  console.log("Accept button clicked globally:", incomingCall);
                  acceptCall(incomingCall.roomId, incomingCall.callerId);
                  setActiveRoom(incomingCall.roomId);
                  setShowCall(true);
                  setIncomingCall(null);
                }}
                title="Accept Call"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
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
          onClose={handleCloseCall}
        />
      )}
    </>
  );
};

export default ChatInterface;
