import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BookOpen, Brain, TrendingUp, Calendar } from "lucide-react";
import { databaseService } from "@/services/databaseService";
import { SavedWord } from "@/types/vocabulary";

interface LearningStats {
  totalWords: number;
  wordsReviewedToday: number;
  averageRetention: number;
  streakDays: number;
  categoryData: Array<{ name: string; value: number; color: string }>;
  weeklyProgress: Array<{ day: string; reviewed: number; learned: number }>;
}

export const StatsDashboard = () => {
  const [stats, setStats] = useState<LearningStats>({
    totalWords: 0,
    wordsReviewedToday: 0,
    averageRetention: 0,
    streakDays: 0,
    categoryData: [],
    weeklyProgress: []
  });

  useEffect(() => {
    loadStatistics();

    const handleDataChange = () => loadStatistics();
    databaseService.addEventListener('datachanged', handleDataChange);

    return () => {
      databaseService.removeEventListener('datachanged', handleDataChange);
    };
  }, []);

  const loadStatistics = async () => {
    try {
      const words = await databaseService.getAllWords();
      const reviewWords = await databaseService.getWordsForReview();
      
      // Calculate basic stats
      const totalWords = words.length;
      const wordsReviewedToday = calculateTodayReviews(words);
      const averageRetention = calculateAverageRetention(words);
      
      // Category data for pie chart
      const categoryData = [
        { name: "Mastered", value: calculateMasteredWords(words), color: "#22c55e" },
        { name: "Learning", value: calculateLearningWords(words), color: "#3b82f6" },
        { name: "New", value: calculateNewWords(words), color: "#f59e0b" },
      ];

      // Weekly progress data from the database service
      const weeklyProgress = await databaseService.getWeeklyProgressData();
      const streakDays = await databaseService.calculateStreakDays();

      setStats({
        totalWords,
        wordsReviewedToday,
        averageRetention,
        streakDays,
        categoryData,
        weeklyProgress
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const calculateTodayReviews = (words: SavedWord[]): number => {
    const today = new Date().toDateString();
    return words.filter(word => {
      if (!word.fsrs_params) return false;
      try {
        const params = JSON.parse(word.fsrs_params);
        const lastReview = params.last_review ? new Date(params.last_review).toDateString() : null;
        return lastReview === today;
      } catch {
        return false;
      }
    }).length;
  };

  const calculateAverageRetention = (words: SavedWord[]): number => {
    if (words.length === 0) return 0;
    
    const totalRetention = words.reduce((sum, word) => {
      if (!word.fsrs_params) return sum;
      try {
        const params = JSON.parse(word.fsrs_params);
        return sum + (params.retrievability || 0);
      } catch {
        return sum;
      }
    }, 0);
    
    return Math.round((totalRetention / words.length) * 100);
  };

  const calculateMasteredWords = (words: SavedWord[]): number => {
    return words.filter(word => {
      if (!word.fsrs_params) return false;
      try {
        const params = JSON.parse(word.fsrs_params);
        return params.stability > 30; // Consider words with high stability as mastered
      } catch {
        return false;
      }
    }).length;
  };

  const calculateLearningWords = (words: SavedWord[]): number => {
    return words.filter(word => {
      if (!word.fsrs_params) return false;
      try {
        const params = JSON.parse(word.fsrs_params);
        return params.stability > 0 && params.stability <= 30;
      } catch {
        return false;
      }
    }).length;
  };

  const calculateNewWords = (words: SavedWord[]): number => {
    return words.filter(word => {
      if (!word.fsrs_params) return true;
      try {
        const params = JSON.parse(word.fsrs_params);
        return params.stability === 0;
      } catch {
        return true;
      }
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Words</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWords}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reviewed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wordsReviewedToday}</p>
              </div>
              <Brain className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRetention}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Streak Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.streakDays}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Words reviewed and learned this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reviewed" fill="#3b82f6" name="Reviewed" />
                <Bar dataKey="learned" fill="#22c55e" name="Learned" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vocabulary Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Distribution</CardTitle>
            <CardDescription>Your learning progress breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your overall vocabulary mastery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{stats.averageRetention}%</span>
              </div>
              <Progress value={stats.averageRetention} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">{stats.categoryData[0]?.value || 0}</p>
                <p className="text-sm text-gray-600">Mastered</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-600">{stats.categoryData[1]?.value || 0}</p>
                <p className="text-sm text-gray-600">Learning</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-orange-600">{stats.categoryData[2]?.value || 0}</p>
                <p className="text-sm text-gray-600">New</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
