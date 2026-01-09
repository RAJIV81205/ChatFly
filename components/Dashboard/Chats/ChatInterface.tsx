"use client";

import { useState, useEffect, useCallback } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./Window/ChatWindow";
import ZegoCallPopup from "@/components/Calls/ZegoCallPopup";
import { getTokenForSocket } from "@/lib/utils/auth";
import { useSocket } from "@/lib/hooks/useSocket";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
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
      // Get caller info if possible
      fetchCallerInfo(callerId).then((callerName) => {
        console.log("👤 Caller info fetched:", callerName);
        setIncomingCall({ callerId, roomId, callerName });
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

  const fetchCallerInfo = async (callerId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/users/by-id/${callerId}`);
      const data = await response.json();
      return data.success ? data.user.fullName || data.user.username : callerId;
    } catch (error) {
      console.error("Error fetching caller info:", error);
      return callerId;
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
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Incoming Video Call</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              From: {incomingCall.callerName || incomingCall.callerId}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </p>

            <div className="flex justify-center gap-4">
              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
                onClick={() => {
                  console.log("Accept button clicked globally:", incomingCall);
                  acceptCall(incomingCall.roomId, incomingCall.callerId);
                  setActiveRoom(incomingCall.roomId);
                  setShowCall(true);
                  setIncomingCall(null);
                }}
              >
                Accept
              </button>

              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                onClick={() => {
                  console.log("Reject button clicked globally:", incomingCall);
                  rejectCall(incomingCall.roomId, incomingCall.callerId);
                  setIncomingCall(null);
                }}
              >
                Decline
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
