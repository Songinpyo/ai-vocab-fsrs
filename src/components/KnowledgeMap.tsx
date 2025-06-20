import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { databaseService } from "@/services/databaseService";
import { SavedWord } from "@/types/vocabulary";
import { Search, BookOpen, Brain, Plus, Filter } from "lucide-react";

interface WordNode {
  id: number;
  text: string;
  phonetic: string;
  status: 'new' | 'learning' | 'mastered';
  stability: number;
  difficulty: number;
  lastReview: Date | null;
  nextReview: Date;
}

export const KnowledgeMap = () => {
  const [words, setWords] = useState<WordNode[]>([]);
  const [filteredWords, setFilteredWords] = useState<WordNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWords();

    const handleDataChange = () => loadWords();
    databaseService.addEventListener('datachanged', handleDataChange);

    return () => {
      databaseService.removeEventListener('datachanged', handleDataChange);
    };
  }, []);

  useEffect(() => {
    filterWords();
  }, [words, searchTerm, statusFilter]);

  const loadWords = async () => {
    try {
      setIsLoading(true);
      const savedWords = await databaseService.getAllWords();
      
      const wordNodes: WordNode[] = savedWords.map(word => {
        let status: 'new' | 'learning' | 'mastered' = 'new';
        let stability = 0;
        let difficulty = 0;
        let lastReview = null;
        let nextReview = new Date();

        if (word.fsrs_params) {
          try {
            const params = JSON.parse(word.fsrs_params);
            stability = params.stability || 0;
            difficulty = params.difficulty || 0;
            lastReview = params.last_review ? new Date(params.last_review) : null;
            nextReview = new Date(params.next_review);

            if (stability > 30) {
              status = 'mastered';
            } else if (stability > 0) {
              status = 'learning';
            }
          } catch (error) {
            console.error("Error parsing FSRS params:", error);
          }
        }

        return {
          id: word.id,
          text: word.text,
          phonetic: word.phonetic,
          status,
          stability,
          difficulty,
          lastReview,
          nextReview
        };
      });

      setWords(wordNodes);
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterWords = () => {
    let filtered = words;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(word =>
        word.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(word => word.status === statusFilter);
    }

    setFilteredWords(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'learning':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'new':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered':
        return <Brain className="w-4 h-4" />;
      case 'learning':
        return <BookOpen className="w-4 h-4" />;
      case 'new':
        return <Plus className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString();
  };

  const getDifficultyLevel = (difficulty: number) => {
    if (difficulty > 3) return 'Hard';
    if (difficulty > 0.5) return 'Medium';
    return 'Easy';
  };

  const getStabilityLevel = (stability: number) => {
    if (stability < 5) return 'Low';
    if (stability < 20) return 'Medium';
    return 'High';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Knowledge Map
          </CardTitle>
          <CardDescription>
            Visualize your vocabulary learning progress and identify areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All ({words.length})
              </Button>
              <Button
                variant={statusFilter === "new" ? "default" : "outline"}
                onClick={() => setStatusFilter("new")}
                size="sm"
              >
                New ({words.filter(w => w.status === 'new').length})
              </Button>
              <Button
                variant={statusFilter === "learning" ? "default" : "outline"}
                onClick={() => setStatusFilter("learning")}
                size="sm"
              >
                Learning ({words.filter(w => w.status === 'learning').length})
              </Button>
              <Button
                variant={statusFilter === "mastered" ? "default" : "outline"}
                onClick={() => setStatusFilter("mastered")}
                size="sm"
              >
                Mastered ({words.filter(w => w.status === 'mastered').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredWords.map((word) => (
          <Card key={word.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Word Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{word.text}</h3>
                    {word.phonetic && (
                      <p className="text-sm text-blue-600 font-mono">{word.phonetic}</p>
                    )}
                  </div>
                  <Badge 
                    className={`${getStatusColor(word.status)} flex items-center gap-1`}
                    variant="outline"
                  >
                    {getStatusIcon(word.status)}
                    {word.status}
                  </Badge>
                </div>

                {/* Progress Metrics */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className={`font-medium ${
                      word.difficulty < 3 ? 'text-green-600' : 
                      word.difficulty < 7 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {getDifficultyLevel(word.difficulty)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stability:</span>
                    <span className={`font-medium ${
                      word.stability < 5 ? 'text-red-600' : 
                      word.stability < 20 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {getStabilityLevel(word.stability)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Review:</span>
                    <span className="font-medium">{formatDate(word.lastReview)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Review:</span>
                    <span className={`font-medium ${
                      word.nextReview <= new Date() ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatDate(word.nextReview)}
                    </span>
                  </div>
                </div>

                {/* Review Status */}
                {word.nextReview <= new Date() && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-2">
                    <p className="text-xs text-red-700 font-medium">Due for review!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWords.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No words found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search term or filters" : "Start adding words to see your knowledge map"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
