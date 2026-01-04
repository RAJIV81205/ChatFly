import { Check } from "lucide-react";

interface MessageStatusProps {
  status: 'sent' | 'read';
  className?: string;
}

export const MessageStatus = ({ status, className = "" }: MessageStatusProps) => {
  if (status === 'read') {
    return (
      <div className={`flex items-center ${className}`} title="Read">
        <div className="relative">
          <Check className="w-3 h-3 text-blue-500" />
          <Check className="w-3 h-3 text-blue-500 absolute -right-1.5 top-0" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center ${className}`} title="Sent">
      <Check className="w-3 h-3 text-zinc-400" />
    </div>
  );
};