import { X, User, Calendar, Clock } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  fullName: string;
  username: string;
  profilePicUrl: string | null;
  lastSeen?: string;
  bio?: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string;
  avatar: string | null;
  members: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    isAdmin: boolean;
  }>;
}

interface ContactProps {
  user: User | null;
  conversation: Conversation;
  currentUserId: string | null;
  onlineUsers: Set<string>;
  userLastSeen: {[userId: string]: string};
  formatLastSeen: (lastSeenString: string) => string;
  isUserOnline: (userId: string) => boolean;
  onClose: () => void;
}

const Contact = ({ 
  user, 
  conversation, 
  currentUserId, 
  onlineUsers, 
  userLastSeen, 
  formatLastSeen, 
  isUserOnline, 
  onClose 
}: ContactProps) => {
  // Get the other user from conversation members
  const otherUser = conversation.members.find(member => member.id !== currentUserId);
  const isOnline = otherUser && (isUserOnline(otherUser.id) || onlineUsers.has(otherUser.id));
  const lastSeen = otherUser && userLastSeen[otherUser.id];

  // Use user data if available, otherwise fall back to conversation member data
  const displayUser = user || {
    id: otherUser?.id || '',
    fullName: otherUser?.name || '',
    username: otherUser?.username || '',
    profilePicUrl: otherUser?.avatar || null,
    lastSeen: lastSeen,
    bio: '',
    createdAt: ''
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Contact Info
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="text-center mb-6">
        {displayUser.profilePicUrl ? (
          <Image
            src={displayUser.profilePicUrl}
            alt={displayUser.fullName}
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-zinc-600 dark:text-zinc-300" />
          </div>
        )}
        
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
          {displayUser.fullName}
        </h3>
        
        <p className="text-zinc-600 dark:text-zinc-400 mb-2">
          @{displayUser.username}
        </p>

        {/* Online Status */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {isOnline 
              ? 'Online' 
              : lastSeen 
                ? `Last seen ${formatLastSeen(lastSeen)}`
                : 'Offline'
            }
          </span>
        </div>
      </div>

      {/* Bio Section */}
      {displayUser.bio && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
            About
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
            {displayUser.bio}
          </p>
        </div>
      )}

      {/* Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Username
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              @{displayUser.username}
            </p>
          </div>
        </div>

        {displayUser.createdAt && (
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Joined
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatJoinDate(displayUser.createdAt)}
              </p>
            </div>
          </div>
        )}

        {lastSeen && !isOnline && (
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Last Seen
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatLastSeen(lastSeen)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
