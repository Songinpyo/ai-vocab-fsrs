import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { databaseService } from "@/services/databaseService";
import { SavedWord } from "@/types/vocabulary";
import { Gamepad2, Zap, Target, Clock, Star, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ReviewResult } from "@/services/fsrsService";

interface GameWord {
  id: number;
  text: string;
  meaning: string;
  partOfSpeech: string;
  korean: string;
}

type GameType = 'wordMatch' | 'speedTranslation' | 'wordScramble';

export const VocabularyGames = () => {
  const [gameType, setGameType] = useState<GameType>('wordMatch');
  const [gameWords, setGameWords] = useState<GameWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    loadGameWords();

    const handleDataChange = () => {
      // Only reload words if a game is not currently active
      if (!gameActive) {
        loadGameWords();
      }
    };
    databaseService.addEventListener('datachanged', handleDataChange);

    return () => {
      databaseService.removeEventListener('datachanged', handleDataChange);
    };
  }, []);

  const loadGameWords = async () => {
    try {
      const words = await databaseService.getWordsForPractice(20);
      const gameWordsData: GameWord[] = [];

      for (const word of words) {
        const details = await databaseService.getWordWithMeanings(word.id);
        if (details.meanings && details.meanings.length > 0) {
          const meaning = details.meanings[0];
          gameWordsData.push({
            id: word.id,
            text: word.text,
            meaning: meaning.englishDefinition,
            partOfSpeech: meaning.partOfSpeech,
            korean: meaning.koreanTranslation
          });
        }
      }

      setGameWords(gameWordsData);
    } catch (error) {
      console.error("Error loading game words:", error);
      toast.error("Failed to load words for games");
    } finally {
      setIsLoading(false);
    }
  };

  const renderGameSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          gameType === 'wordMatch' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => setGameType('wordMatch')}
      >
        <CardContent className="p-6 text-center">
          <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Word Match</h3>
          <p className="text-sm text-gray-600">Match words with their meanings</p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          gameType === 'speedTranslation' ? 'ring-2 ring-green-500 bg-green-50' : ''
        }`}
        onClick={() => setGameType('speedTranslation')}
      >
        <CardContent className="p-6 text-center">
          <Zap className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Speed Translation</h3>
          <p className="text-sm text-gray-600">Quick Korean translation challenge</p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          gameType === 'wordScramble' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
        }`}
        onClick={() => setGameType('wordScramble')}
      >
        <CardContent className="p-6 text-center">
          <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Word Scramble</h3>
          <p className="text-sm text-gray-600">Unscramble the letters</p>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Gamepad2 className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
            <p>Loading vocabulary games...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameWords.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Games Available</h3>
          <p className="text-gray-500 mb-6">Add more words to unlock vocabulary games.</p>
          <Button onClick={() => window.location.href = "/"}>Add Words</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!gameActive && renderGameSelector()}
      
      {gameType === 'wordMatch' && <WordMatchGame words={gameWords} />}
      {gameType === 'speedTranslation' && <SpeedTranslationGame words={gameWords} />}
      {gameType === 'wordScramble' && <WordScrambleGame words={gameWords} />}
    </div>
  );
};

// Word Match Game Component
const WordMatchGame = ({ words }: { words: GameWord[] }) => {
  const [shuffledWords, setShuffledWords] = useState<GameWord[]>([]);
  const [shuffledMeanings, setShuffledMeanings] = useState<GameWord[]>([]);
  const [activeWord, setActiveWord] = useState<GameWord | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    const gameWords = words.sort(() => Math.random() - 0.5).slice(0, 6);
    setShuffledWords(gameWords);
    setShuffledMeanings([...gameWords].sort(() => Math.random() - 0.5));
    setMatchedIds(new Set());
    setScore(0);
    setActiveWord(null);
    setGameStarted(true);
  };

  const handleWordClick = (word: GameWord) => {
    if (matchedIds.has(word.id)) return;
    setActiveWord(word);
  };

  const handleMeaningClick = async (meaningWord: GameWord) => {
    if (!activeWord || matchedIds.has(meaningWord.id)) return;

    if (activeWord.id === meaningWord.id) {
      // Correct match
      setMatchedIds(prev => new Set(prev).add(activeWord.id));
      setScore(prev => prev + 1);
      toast.success(`'${activeWord.text}' - Correct!`);
      try {
        await databaseService.recordReview(activeWord.id, ReviewResult.GOOD);
      } catch (e) { toast.error("Failed to update progress."); }
    } else {
      // Incorrect match
      toast.error(`'${activeWord.text}' - Incorrect. Try again.`);
      try {
        await databaseService.recordReview(activeWord.id, ReviewResult.HARD);
      } catch (e) { toast.error("Failed to update progress."); }
    }
    setActiveWord(null);
  };

  if (!gameStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Word Match Game
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Match words with their correct meanings!</p>
          <Button onClick={startGame} size="lg">Start Game</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Word Match
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-sm">Score: {score}</span>
            <Button variant="outline" size="sm" onClick={startGame}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-center">Words</h3>
            {shuffledWords.map((word) => (
              <Button
                key={word.id}
                variant={matchedIds.has(word.id) ? "default" : activeWord?.id === word.id ? "secondary" : "outline"}
                className="w-full"
                onClick={() => handleWordClick(word)}
                disabled={matchedIds.has(word.id)}
              >
                {word.text}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-center">Meanings</h3>
            {shuffledMeanings.map((meaningWord) => (
              <Button
                key={meaningWord.id}
                variant={matchedIds.has(meaningWord.id) ? "default" : "outline"}
                className="w-full text-left h-auto p-3"
                onClick={() => handleMeaningClick(meaningWord)}
                disabled={matchedIds.has(meaningWord.id)}
              >
                {meaningWord.meaning}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Speed Translation Game Component
const SpeedTranslationGame = ({ words }: { words: GameWord[] }) => {
  const [currentWord, setCurrentWord] = useState<GameWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setGameActive(false);
      toast.success(`Game Over! Final Score: ${score}`);
    }
    return () => clearTimeout(timer);
  }, [gameActive, timeLeft, score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setGameActive(true);
    setGameStarted(true);
    generateQuestion();
  };

  const generateQuestion = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    const wrongOptions = words
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.korean);
    
    const allOptions = [word.korean, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    setCurrentWord(word);
    setOptions(allOptions);
  };

  const handleAnswer = (selectedKorean: string) => {
    if (currentWord && selectedKorean === currentWord.korean) {
      setScore(prev => prev + 1);
      toast.success("Correct! +1 point");
    } else {
      toast.error("Wrong answer!");
    }
    generateQuestion();
  };

  if (!gameStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Speed Translation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Translate English words to Korean as fast as you can!</p>
          <p className="text-sm text-gray-500">60 seconds • 1 point per correct answer</p>
          <Button onClick={startGame} size="lg">Start Game</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Speed Translation
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={`font-mono ${timeLeft <= 10 ? 'text-red-600' : ''}`}>
                {timeLeft}s
              </span>
            </div>
            <span className="text-sm">Score: {score}</span>
          </div>
        </div>
        <Progress value={(timeLeft / 60) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {currentWord && gameActive && (
          <>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-600">{currentWord.text}</div>
              <Badge variant="secondary">{currentWord.partOfSpeech}</Badge>
              <p className="text-gray-600">{currentWord.meaning}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleAnswer(option)}
                  className="h-auto p-4 text-lg"
                >
                  {option}
                </Button>
              ))}
            </div>
          </>
        )}
        
        {!gameActive && gameStarted && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">Game Over!</div>
            <div className="text-xl text-blue-600">Final Score: {score}</div>
            <Button onClick={startGame}>Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Word Scramble Game Component
const WordScrambleGame = ({ words }: { words: GameWord[] }) => {
  const [currentWord, setCurrentWord] = useState<GameWord | null>(null);
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const startGame = () => {
    setScore(0);
    setGameStarted(true);
    generateScramble();
  };

  const generateScramble = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    const letters = word.text.split('').sort(() => Math.random() - 0.5);
    
    setCurrentWord(word);
    setScrambledLetters(letters);
    setUserAnswer([]);
    setShowHint(false);
  };

  const handleLetterClick = (letter: string, index: number) => {
    setUserAnswer([...userAnswer, letter]);
    setScrambledLetters(scrambledLetters.filter((_, i) => i !== index));
  };

  const handleAnswerLetterClick = (letter: string, index: number) => {
    setScrambledLetters([...scrambledLetters, letter]);
    setUserAnswer(userAnswer.filter((_, i) => i !== index));
  };

  const checkAnswer = () => {
    if (currentWord && userAnswer.join('').toLowerCase() === currentWord.text.toLowerCase()) {
      setScore(prev => prev + 1);
      toast.success("Correct! +1 point");
      generateScramble();
    } else {
      toast.error("Try again!");
    }
  };

  if (!gameStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Word Scramble
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Unscramble the letters to form the correct word!</p>
          <Button onClick={startGame} size="lg">Start Game</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Word Scramble
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-sm">Score: {score}</span>
            <Button variant="outline" size="sm" onClick={() => setShowHint(!showHint)}>
              Hint
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentWord && (
          <>
            {showHint && (
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Hint:</p>
                <p className="font-medium">{currentWord.meaning}</p>
                <Badge variant="secondary" className="mt-2">{currentWord.partOfSpeech}</Badge>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Scrambled letters:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {scrambledLetters.map((letter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-12 h-12 text-lg font-bold"
                      onClick={() => handleLetterClick(letter, index)}
                    >
                      {letter.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Your answer:</p>
                <div className="flex flex-wrap justify-center gap-2 min-h-[3rem]">
                  {userAnswer.map((letter, index) => (
                    <Button
                      key={index}
                      variant="default"
                      className="w-12 h-12 text-lg font-bold"
                      onClick={() => handleAnswerLetterClick(letter, index)}
                    >
                      {letter.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={checkAnswer}
                disabled={userAnswer.length === 0}
              >
                Check Answer
              </Button>
              <Button variant="outline" onClick={generateScramble}>
                Skip Word
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};