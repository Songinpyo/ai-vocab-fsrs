import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { databaseService } from "@/services/databaseService";
import { fsrsService, ReviewResult } from "@/services/fsrsService";
import { SavedWord } from "@/types/vocabulary";
import { toast } from "sonner";
import { Brain, BookOpen, Clock, Trophy, RotateCcw } from "lucide-react";

const Study = () => {
  const [reviewWords, setReviewWords] = useState<SavedWord[]>([]);
  const [lastSessionWords, setLastSessionWords] = useState<SavedWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      const savedLastSession = localStorage.getItem('last_study_session');
      if (savedLastSession) {
        try {
          setLastSessionWords(JSON.parse(savedLastSession));
        } catch (e) {
          console.error("Failed to parse last study session from localStorage", e);
        }
      }

      await loadReviewWords();
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (reviewWords.length > 0 && currentWordIndex < reviewWords.length) {
      loadCurrentWord();
    }
  }, [reviewWords, currentWordIndex]);

  const loadReviewWords = async () => {
    try {
      const words = await databaseService.getWordsForReview();
      setReviewWords(words);
      setCurrentWordIndex(0);
      setSessionCompleted(false);
    } catch (error) {
      console.error("Error loading review words:", error);
      toast.error("Failed to load words for review");
    }
  };

  const loadCurrentWord = async () => {
    if (currentWordIndex >= reviewWords.length) return;

    try {
      const wordWithMeanings = await databaseService.getWordWithMeanings(
        reviewWords[currentWordIndex].id
      );
      setCurrentWord(wordWithMeanings);
      setShowAnswer(false);
    } catch (error) {
      console.error("Error loading current word:", error);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const handleReview = async (result: ReviewResult) => {
    if (!currentWord) return;

    try {
      await databaseService.recordReview(currentWord.id, result);

      // Move to next word
      const nextIndex = currentWordIndex + 1;
      if (nextIndex >= reviewWords.length) {
        toast.success("Review session completed! 🎉");
        setSessionCompleted(true);
        
        // Merge the just-completed session with the stored last session to preserve all words studied today.
        const sessionMap = new Map();
        lastSessionWords.forEach(word => sessionMap.set(word.id, word));
        reviewWords.forEach(word => sessionMap.set(word.id, word));
        const updatedLastSession = Array.from(sessionMap.values());

        setLastSessionWords(updatedLastSession);
        localStorage.setItem('last_study_session', JSON.stringify(updatedLastSession));
        setCurrentWord(null);
      } else {
        setCurrentWordIndex(nextIndex);
      }
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    }
  };

  const handleRepeatSession = () => {
    const wordsToUse = lastSessionWords;
    if (wordsToUse.length > 0) {
      setIsSessionLoading(true);

      // Defensive deduplication to prevent counter errors
      const sessionMap = new Map();
      wordsToUse.forEach(word => sessionMap.set(word.id, word));
      const uniqueWords = Array.from(sessionMap.values());

      setReviewWords([...uniqueWords].sort(() => Math.random() - 0.5));
      setCurrentWordIndex(0);
      setSessionCompleted(false);
      setShowAnswer(false);
    } else {
      toast.info("No session available to repeat.");
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">{isLoading ? "Loading your study session..." : "Preparing your review..."}</p>
        </div>
      </div>
    );
  }

  const hasWordsToReview = reviewWords.length > 0;

  if (sessionCompleted || !hasWordsToReview) {
    const isInitialEmptyState = !hasWordsToReview && !sessionCompleted;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            {isInitialEmptyState ? 
              <BookOpen className="w-16 h-16 text-purple-600 mx-auto mb-6" /> :
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            }
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isInitialEmptyState ? "No Words to Review" : "Session Complete!"}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {isInitialEmptyState 
                ? "Great job! You're all caught up. Add new words or repeat your last session." 
                : "You've reviewed all your words for now. Well done!"}
            </p>
            <div className="flex justify-center gap-4">
              {!isInitialEmptyState && (
                <Button onClick={handleRepeatSession} className="bg-purple-600 hover:bg-purple-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repeat Today's Session
                </Button>
              )}
              {lastSessionWords.length > 0 && isInitialEmptyState && (
                 <Button onClick={handleRepeatSession} className="bg-purple-600 hover:bg-purple-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repeat Last Session
                </Button>
              )}
              <Button onClick={() => window.location.href = "/"} variant="outline">
                Add New Words
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Study Session</h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {currentWordIndex + 1} of {reviewWords.length}
              </span>
            </div>
          </div>

          {/* Study Card */}
          <Card className="bg-white shadow-xl border-2 border-purple-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {currentWord.text}
                </h2>
                {currentWord.phonetic && (
                  <p className="text-xl text-purple-600 font-mono mb-6">
                    {currentWord.phonetic}
                  </p>
                )}
                
                {!showAnswer && (
                  <Button 
                    onClick={() => setShowAnswer(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                  >
                    Show Meanings
                  </Button>
                )}
              </div>

              {showAnswer && (
                <div className="space-y-6 mb-8">
                  {currentWord.meanings.map((meaning: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6">
                      <div className="mb-4">
                        <Badge variant="secondary" className="mb-2">
                          {meaning.partOfSpeech}
                        </Badge>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          {meaning.englishDefinition}
                        </p>
                        <p className="text-lg text-blue-700 font-medium">
                          🇰🇷 {meaning.koreanTranslation}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Examples:</p>
                        {meaning.examples.map((example: string, exIndex: number) => (
                          <div key={exIndex} className="text-sm text-gray-600 bg-white p-3 rounded border-l-3 border-purple-300 italic">
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Review Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
                    <Button
                      onClick={() => handleReview(ReviewResult.AGAIN)}
                      variant="destructive"
                      className="py-3"
                    >
                      Again
                    </Button>
                    <Button
                      onClick={() => handleReview(ReviewResult.HARD)}
                      className="bg-orange-500 hover:bg-orange-600 py-3"
                    >
                      Hard
                    </Button>
                    <Button
                      onClick={() => handleReview(ReviewResult.GOOD)}
                      className="bg-green-500 hover:bg-green-600 py-3"
                    >
                      Good
                    </Button>
                    <Button
                      onClick={() => handleReview(ReviewResult.EASY)}
                      className="bg-blue-500 hover:bg-blue-600 py-3"
                    >
                      Easy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Study;
