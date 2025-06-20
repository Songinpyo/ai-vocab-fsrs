import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizGenerator } from "@/components/QuizGenerator";
import { VocabularyGames } from "@/components/VocabularyGames";
import { Gamepad2, Brain, Trophy } from "lucide-react";

const Games = () => {
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);

  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Gamepad2 className="w-10 h-10 text-purple-600" />
              Interactive Learning
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Make vocabulary learning fun with interactive quizzes and engaging games
            </p>
          </div>

          {/* Recent Score Display */}
          {quizScore && (
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold">Latest Quiz Result</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {quizScore.score}/{quizScore.total} ({Math.round((quizScore.score / quizScore.total) * 100)}%)
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="quiz" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="quiz" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Context Quiz
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Vocabulary Games
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quiz" className="space-y-6">
              <QuizGenerator onQuizComplete={handleQuizComplete} />
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <VocabularyGames />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Games;