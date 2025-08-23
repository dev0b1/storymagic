import { FileText, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserMessageProps {
  content: string;
  isPdf?: boolean;
  timestamp: Date;
}

export function UserMessage({ content, isPdf = false, timestamp }: UserMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[80%] md:max-w-[60%]">
        <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          <div className="flex items-start space-x-2">
            {isPdf && (
              <div className="flex-shrink-0 mt-1">
                <FileText className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {content.length > 200 ? `${content.substring(0, 200)}...` : content}
              </p>
              {isPdf && (
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white mt-2 text-xs">
                  PDF Upload
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 text-right mt-1 mr-2">
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
}
