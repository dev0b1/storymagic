interface Character {
  id: 'lumi' | 'spark' | 'bella';
  name: string;
  emoji: string;
  avatar: string;
  description: string;
  bgGradient: string;
  textColor: string;
}

interface CharacterCardProps {
  character: Character;
  selected: boolean;
  onSelect: (characterId: Character['id']) => void;
}

export function CharacterCard({ character, selected, onSelect }: CharacterCardProps) {
  return (
    <div
      className={`
        p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg
        ${character.bgGradient}
        ${selected 
          ? 'border-purple-500 ring-2 ring-purple-300' 
          : 'border-transparent hover:border-purple-300'
        }
      `}
      onClick={() => onSelect(character.id)}
      data-testid={`character-${character.id}`}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{character.avatar || character.emoji}</div>
        <h5 className={`font-semibold text-sm ${character.textColor}`}>{character.name}</h5>
        <p className={`text-xs ${character.textColor} opacity-80 leading-tight`}>{character.description}</p>
      </div>
    </div>
  );
}

export const CHARACTERS: Character[] = [
  {
    id: 'lumi',
    name: 'Lumi the Owl',
    emoji: '🦉',
    avatar: '🦉',
    description: 'Calm & Wise',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    textColor: 'text-indigo-800'
  },
  {
    id: 'spark',
    name: 'Sir Spark',
    emoji: '🦊',
    avatar: '🦊',
    description: 'Cheeky & Fast',
    bgGradient: 'bg-gradient-to-br from-orange-50 to-red-100',
    textColor: 'text-red-800'
  },
  {
    id: 'bella',
    name: 'Bella the Bot',
    emoji: '🤖',
    avatar: '🤖',
    description: 'Curious & Cheerful',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-pink-100',
    textColor: 'text-purple-800'
  }
];
