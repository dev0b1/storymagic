import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  ChevronDown,
  Loader2,
  X,
  FileText
} from 'lucide-react';
import { NARRATION_MODES } from '@/components/narration-mode-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ChatInputProps {
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onFileUpload: (file: File) => void;
  selectedNarrationMode: 'focus' | 'engaging' | 'doc_theatre';
  onNarrationModeChange: (mode: 'focus' | 'engaging' | 'doc_theatre') => void;
  isGenerating: boolean;
  maxLength: number;
  maxFileSize: string;
  remainingCredits?: number;
  isPremium?: boolean;
  attachedFile?: File | null;
  onRemoveFile?: () => void;
}

export function ChatInput({
  inputText,
  onInputChange,
  onSubmit,
  onFileUpload,
  selectedNarrationMode,
  onNarrationModeChange,
  isGenerating,
  maxLength,
  maxFileSize,
  remainingCredits,
  isPremium = false,
  attachedFile = null,
  onRemoveFile
}: ChatInputProps) {
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 20; // Approximate line height
      const maxLines = 5;
      const maxHeight = lineHeight * maxLines;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        if (canSubmit) {
          onSubmit();
        }
      }
      // Allow normal Enter for new lines
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = ''; // Reset input
    }
  };

  const canSubmit = (inputText.trim() || attachedFile) && 
                    !isGenerating && 
                    inputText.length <= maxLength && 
                    (isPremium || (remainingCredits && remainingCredits > 0));

  const currentMode = NARRATION_MODES.find(m => m.id === selectedNarrationMode) || NARRATION_MODES[0];

  const getModeTooltip = (mode: typeof currentMode) => {
    switch (mode.id) {
      case 'engaging': return 'Narration — Neutral, professional reading.';
      case 'focus': return 'Lecture — Clear, structured explanation.';
      case 'doc_theatre': return 'Podcast — Conversational, engaging style.';
      default: return mode.description;
    }
  };

  return (
    <TooltipProvider>
      <div className="sticky bottom-0 border-t border-gray-200 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          {/* Credits Warning */}
          {!isPremium && remainingCredits !== undefined && remainingCredits <= 3 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>{remainingCredits} stories remaining</strong> in your free plan.
                {remainingCredits === 0 && " Upgrade to continue creating content."}
              </p>
            </div>
          )}

          {/* Main Composer */}
          <div className="flex items-end gap-3 bg-gray-100 rounded-2xl p-3 border border-gray-300">
            {/* Mode Selector */}
            {isMobile ? (
              <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 h-10"
                    disabled={isGenerating}
                  >
                    <span className="text-lg">{currentMode.icon}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Choose Narration Style</SheetTitle>
                    <SheetDescription>
                      Select how you'd like your content to be narrated
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-3 mt-4">
                    {NARRATION_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          onNarrationModeChange(mode.id);
                          setShowMobileSheet(false);
                        }}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          selectedNarrationMode === mode.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{mode.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{mode.name}</h4>
                            <p className="text-sm text-gray-600">{getModeTooltip(mode)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={selectedNarrationMode}
                    onValueChange={onNarrationModeChange}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="flex-shrink-0 w-32 h-10 bg-white border-gray-300 focus:ring-0 focus:border-gray-300">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          {currentMode.icon} {currentMode.name}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {NARRATION_MODES.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          <span className="flex items-center gap-2">
                            {mode.icon} {mode.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getModeTooltip(currentMode)}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Text Area Container */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  onInputChange(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyPress}
                placeholder="Type a topic or paste content…"
                className={`min-h-[40px] max-h-[120px] resize-none border-0 bg-white rounded-lg px-3 py-2 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
                  attachedFile ? 'pb-10' : ''
                }`}
                disabled={isGenerating}
                rows={1}
                style={{ overflowY: 'auto' }}
              />
              
              {/* PDF Chip */}
              {attachedFile && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                  <FileText className="w-3 h-3" />
                  <span className="max-w-20 truncate">{attachedFile.name}</span>
                  <button
                    onClick={onRemoveFile}
                    className="hover:bg-blue-200 rounded-full p-0.5 ml-1"
                    disabled={isGenerating}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* PDF Upload Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileSelect}
              disabled={isGenerating}
              className="flex-shrink-0 h-10 px-3"
            >
              <Paperclip className="w-4 h-4 mr-1" />
              <span className="text-xs">PDF</span>
            </Button>

            {/* Send Button */}
            <Button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="flex-shrink-0 h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-xs">Crafting audio…</span>
                </>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Helper Text */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              Type a topic or upload a PDF to create audio. PDF up to {maxFileSize}.
              {!isMobile && (
                <>
                  {' • '}
                  <kbd className="px-1 bg-gray-100 rounded text-xs">⌘↵</kbd> to send
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
