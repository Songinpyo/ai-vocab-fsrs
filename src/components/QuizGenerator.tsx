import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { databaseService } from "@/services/databaseService";
import { fsrsService } from "@/services/fsrsService";
import { ReviewResult } from "@/services/fsrsService";
import { SavedWord } from "@/types/vocabulary";
import { Brain, CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";

interface QuizQuestion {
  id: number;
  word: string;
  sentence: string;
  blankedSentence: string;
  options: string[];
  correctAnswer: string;
  meaning: string;
  partOfSpeech: string;
}

interface QuizGeneratorProps {
  onQuizComplete?: (score: number, total: number) => void;
}

export const QuizGenerator = ({ onQuizComplete }: QuizGeneratorProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizMode, setQuizMode] = useState<'fillBlank' | 'multipleChoice'>('fillBlank');
  const [isLoading, setIsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    generateQuiz();

    const handleDataChange = () => {
      // Only regenerate the quiz if it hasn't started yet
      if (currentQuestionIndex === 0 && !showResult) {
        generateQuiz();
      }
    };
    databaseService.addEventListener('datachanged', handleDataChange);

    return () => {
      databaseService.removeEventListener('datachanged', handleDataChange);
    };
  }, []);

  const generateQuiz = async () => {
    try {
      setIsLoading(true);
      const selectedWords = await databaseService.getWordsForPractice(5);
      
      if (selectedWords.length === 0) {
        toast.error("No words available for quiz. Add some words or study more to get started!");
        setIsLoading(false);
        return;
      }

      const quizQuestions: QuizQuestion[] = [];

      for (const word of selectedWords) {
        const wordDetails = await databaseService.getWordWithMeanings(word.id);
        
        if (wordDetails.meanings && wordDetails.meanings.length > 0) {
          const meaning = wordDetails.meanings[0];
          
          if (meaning.examples && meaning.examples.length > 0) {
            const example = meaning.examples[0];
            const wordRegex = new RegExp(`\\b${word.text}\\b`, 'gi');
            
            if (wordRegex.test(example)) {
              const blankedSentence = example.replace(wordRegex, '______');
              
              // Generate distractors for multiple choice
              const otherWords = selectedWords.filter(w => w.id !== word.id && w.text.length > 2)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(w => w.text);
              
              const options = [word.text, ...otherWords].sort(() => Math.random() - 0.5);

              quizQuestions.push({
                id: word.id,
                word: word.text,
                sentence: example,
                blankedSentence,
                options,
                correctAnswer: word.text,
                meaning: meaning.englishDefinition,
                partOfSpeech: meaning.partOfSpeech
              });
            }
          }
        }
      }

      setQuestions(quizQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizCompleted(false);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const answer = quizMode === 'fillBlank' ? userAnswer.trim() : selectedOption;
    const correct = answer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }

    // Record the review result to update FSRS params
    const result = correct ? ReviewResult.GOOD : ReviewResult.HARD;
    try {
      await databaseService.recordReview(currentQuestion.id, result);
    } catch (error) {
      toast.error("Could not update learning progress.");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer("");
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      onQuizComplete?.(score + (isCorrect ? 1 : 0), questions.length);
    }
  };

  const resetQuiz = () => {
    generateQuiz();
    setUserAnswer("");
    setSelectedOption(null);
    setShowResult(false);
    setQuizCompleted(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
            <p>Generating quiz questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quiz Available</h3>
          <p className="text-gray-500 mb-6">Add more words with example sentences to generate quizzes.</p>
          <Button onClick={() => window.location.href = "/"}>Add Words</Button>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardHeader className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-4xl font-bold text-blue-600">
            {score}/{questions.length}
          </div>
          <div className="text-xl text-gray-600">
            {percentage}% Correct
          </div>
          <div className="space-y-2">
            {percentage >= 80 && <p className="text-green-600 font-medium">🎉 Excellent work!</p>}
            {percentage >= 60 && percentage < 80 && <p className="text-blue-600 font-medium">👍 Good job!</p>}
            {percentage < 60 && <p className="text-orange-600 font-medium">📚 Keep practicing!</p>}
          </div>
          <Button onClick={resetQuiz} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Context Quiz
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={quizMode === 'fillBlank' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuizMode('fillBlank')}
            >
              Fill Blank
            </Button>
            <Button
              variant={quizMode === 'multipleChoice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuizMode('multipleChoice')}
            >
              Multiple Choice
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>Score: {score}/{currentQuestionIndex + (showResult && isCorrect ? 1 : 0)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg leading-relaxed">
              {currentQuestion.blankedSentence}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{currentQuestion.partOfSpeech}</Badge>
            <span className="text-sm text-gray-600">{currentQuestion.meaning}</span>
          </div>
        </div>

        {!showResult && (
          <div className="space-y-4">
            {quizMode === 'fillBlank' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fill in the blank:</label>
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter the missing word..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose the correct word:</label>
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedOption === option ? 'default' : 'outline'}
                      onClick={() => setSelectedOption(option)}
                      className="text-left justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSubmitAnswer}
              disabled={quizMode === 'fillBlank' ? !userAnswer.trim() : !selectedOption}
              className="w-full"
            >
              Submit Answer
            </Button>
          </div>
        )}

        {showResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-sm">
                    The correct answer is: <strong>{currentQuestion.correctAnswer}</strong>
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Complete sentence:</p>
              <p className="font-medium">{currentQuestion.sentence}</p>
            </div>
            
            <Button onClick={handleNextQuestion} className="w-full">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};