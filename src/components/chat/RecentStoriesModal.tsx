import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Volume2, 
  FileText, 
  X 
} from 'lucide-react';
import { NARRATION_MODES } from '@/components/narration-mode-card';
import type { Story } from '@shared/schema';

interface RecentStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  onSelectStory: (story: Story) => void;
}

export function RecentStoriesModal({ 
  isOpen, 
  onClose, 
  stories, 
  onSelectStory 
}: RecentStoriesModalProps) {
  const formatDate = (dateValue: Date | string | null) => {
    if (!dateValue) return 'Unknown';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNarrationModeBorderColor = (storyMode: string) => {
    switch (storyMode) {
      case 'focus': return 'border-l-violet-400';
      case 'engaging': return 'border-l-rose-400';
      case 'doc_theatre': return 'border-l-gray-400';
      default: return 'border-l-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
            Recent Audio Content
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-2 -mr-2">
          {stories.length > 0 ? (
            <div className="space-y-3">
              {stories.map((story) => {
                const mode = NARRATION_MODES.find(m => m.id === story.narration_mode);
                return (
                  <div
                    key={story.id}
                    className={`p-4 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 hover:shadow-md border-l-4 ${getNarrationModeBorderColor(story.narration_mode)} hover:border-blue-200`}
                    onClick={() => {
                      onSelectStory(story);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {mode?.icon} {mode?.name || 'Unknown'}
                          </Badge>
                          {story.source === 'pdf' && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                              PDF
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(story.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-2">
                          {story.input_text.length > 100 
                            ? `${story.input_text.substring(0, 100)}...`
                            : story.input_text
                          }
                        </p>
                        <div className="text-xs text-gray-600">
                          ~{story.output_story.split(' ').length} words • {story.content_type || 'general'}
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 text-center">
                          Select
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-medium text-gray-900 mb-2">No audio created yet</h3>
              <p className="text-gray-500 text-sm">
                Your audio content history will appear here
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
