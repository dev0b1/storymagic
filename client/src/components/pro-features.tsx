import { Button } from '@/components/ui/button';
import { Crown, Book, UserPlus, FileAudio, Infinity, Code, Lock } from 'lucide-react';

export function ProFeatures() {
  const features = [
    { icon: Book, text: "Upload eBooks for story generation" },
    { icon: UserPlus, text: "Create your own characters" },
    { icon: FileAudio, text: "Export to audio (.mp3) or PDF" },
    { icon: Infinity, text: "Save unlimited stories" },
    { icon: Code, text: "API Access for developers" }
  ];

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-dashed border-purple-300">
      <div className="text-center mb-4">
        <Crown className="text-3xl text-yellow-500 mb-2 mx-auto w-8 h-8" />
        <h3 className="font-magical text-xl text-purple-800">🌟 StoryMagic Pro</h3>
        <p className="text-sm text-gray-600">(Coming Soon)</p>
      </div>
      
      <div className="space-y-3 mb-6 opacity-60">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <feature.icon className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700">{feature.text}</span>
          </div>
        ))}
      </div>
      
      <Button 
        disabled 
        className="w-full bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
        data-testid="button-pro-upgrade"
      >
        <Lock className="w-4 h-4 mr-2" />
        Coming Soon!
      </Button>
    </div>
  );
}
