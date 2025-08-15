interface NarrationMode {
  id: 'focus' | 'balanced' | 'engaging';
  name: string;
  icon: string;
  description: string;
  bgGradient: string;
  textColor: string;
  useCase: string;
}

interface NarrationModeCardProps {
  mode: NarrationMode;
  selected: boolean;
  onSelect: (modeId: NarrationMode['id']) => void;
}

export function NarrationModeCard({ mode, selected, onSelect }: NarrationModeCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg
        ${mode.bgGradient}
        ${selected 
          ? 'border-blue-500 ring-2 ring-blue-300' 
          : 'border-transparent hover:border-blue-300'
        }
      `}
      onClick={() => onSelect(mode.id)}
      data-testid={`narration-mode-${mode.id}`}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">{mode.icon}</div>
        <h5 className={`font-semibold text-sm ${mode.textColor} mb-1`}>{mode.name}</h5>
        <p className={`text-xs ${mode.textColor} opacity-80 leading-tight mb-2`}>{mode.description}</p>
        <div className={`text-xs ${mode.textColor} opacity-60 italic`}>{mode.useCase}</div>
      </div>
    </div>
  );
}

export const NARRATION_MODES: NarrationMode[] = [
  {
    id: 'focus',
    name: 'Clarity',
    icon: '✨',
    description: 'Crystal-clear knowledge delivery',
    bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-100',
    textColor: 'text-purple-900',
    useCase: 'When precision meets enlightenment'
  },
  {
    id: 'balanced',
    name: 'Guide',
    icon: '🎯',
    description: 'Your friendly knowledge companion',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-orange-100',
    textColor: 'text-orange-900',
    useCase: 'Like learning from a brilliant friend'
  },
  {
    id: 'engaging',
    name: 'Storyteller',
    icon: '💫',
    description: 'Where knowledge meets imagination',
    bgGradient: 'bg-gradient-to-br from-rose-50 to-pink-100',
    textColor: 'text-rose-900',
    useCase: 'Making learning unforgettable'
  }
];
