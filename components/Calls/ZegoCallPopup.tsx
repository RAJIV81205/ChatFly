"use client";
import { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

interface Props {
  roomId: string;
  userId: string;
  onClose: () => void;
}

export default function ZegoCallPopup({ roomId, userId, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const zegoInstanceRef = useRef<any>(null);
  const hasJoinedRef = useRef(false);
  
  // Add this ref to store the latest onClose
  const onCloseRef = useRef(onClose);

  // Update the ref whenever onClose changes
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!rootRef.current || hasJoinedRef.current) return;

    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';

    // Handle escape key - use ref instead of direct onClose
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        hasJoinedRef.current = true;

        const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET;

        if (!appId || !serverSecret) {
          throw new Error('Zego env not configured.');
        }

        console.log('Starting call setup with:', { appId, userId, roomId });

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appId,
          serverSecret,
          roomId,
          userId,
          `use_${userId}`,
          720
        );

        console.log('Kit token generated successfully');

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoInstanceRef.current = zp;

        console.log('ZegoUIKitPrebuilt instance created, joining room...');

        await zp.joinRoom({
          container: rootRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          maxUsers: 2,
          layout: "Auto",
          showLayoutButton: false,
          showRoomTimer: true,
          sharedLinks: [],
          onLeaveRoom: () => {
            console.log('User left room');
            cleanup();
            onCloseRef.current(); // Use ref here
          },
          onJoinRoom: () => {
            console.log('Successfully joined room:', roomId);
            setLoading(false);
          },
          onUserJoin: (users: any[]) => {
            console.log('Users joined:', users);
          },
          onUserLeave: (users: any[]) => {
            console.log('Users left:', users);
          }
        });

        console.log('Room join initiated successfully');
        setLoading(false);
      } catch (err) {
        console.error('Error initializing call:', err);
        hasJoinedRef.current = false;
        setError(err instanceof Error ? err.message : 'Failed to initialize call');
        setLoading(false);
      }
    };

    load();

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
      cleanup();
    };
  }, [roomId, userId]); // onClose removed from dependencies

  const cleanup = () => {
    document.body.style.overflow = 'unset';
    if (zegoInstanceRef.current) {
      try {
        zegoInstanceRef.current.destroy();
      } catch (err) {
        console.error('Error cleaning up Zego instance:', err);
      }
      zegoInstanceRef.current = null;
    }
    hasJoinedRef.current = false;
  };

  const handleClose = () => {
    cleanup();
    onCloseRef.current(); // Use ref here instead of direct onClose
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-9999">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Call Error</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError(null);
                hasJoinedRef.current = false;
                setLoading(true);
              }}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
              Retry
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-9999"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-neutral-900 rounded-lg p-2 w-[90vw] max-w-[900px] h-[80vh] max-h-[550px] shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 rounded-lg z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">Connecting to call...</p>
              <p className="text-gray-400 text-sm mt-2">Room: {roomId.split('-').pop()}</p>
            </div>
          </div>
        )}
        
        <div ref={rootRef} className="w-full h-full rounded-lg overflow-hidden" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition z-20 shadow-lg"
          title="End Call"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Call info overlay */}
        {!loading && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            Room: {roomId.split('-').pop()}
          </div>
        )}
      </div>
    </div>
  );
}
