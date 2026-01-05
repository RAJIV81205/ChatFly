import { Check } from "lucide-react";
import { memo } from "react";

interface MessageStatusProps {
  status: 'sent' | 'read';
  className?: string;
}

export const MessageStatus = memo(({ status, className = "" }: MessageStatusProps) => {
//   console.log('🎨 MessageStatus rendering:', status);
  
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
});