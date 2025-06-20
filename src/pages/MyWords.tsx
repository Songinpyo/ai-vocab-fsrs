import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { databaseService } from "@/services/databaseService";
import { SavedWord } from "@/types/vocabulary";
import { BookOpen, Search, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyWords = () => {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<SavedWord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());
  const [wordDetails, setWordDetails] = useState<Map<number, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [wordToDelete, setWordToDelete] = useState<SavedWord | null>(null);

  useEffect(() => {
    loadWords();

    const handleDataChange = () => loadWords();
    databaseService.addEventListener('datachanged', handleDataChange);

    return () => {
      databaseService.removeEventListener('datachanged', handleDataChange);
    };
  }, []);

  useEffect(() => {
    const filtered = words.filter(word =>
      word.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWords(filtered);
  }, [words, searchTerm]);

  const loadWords = async () => {
    try {
      const allWords = await databaseService.getAllWords();
      setWords(allWords);
    } catch (error) {
      console.error("Error loading words:", error);
      toast.error("Failed to load your vocabulary");
    } finally {
      setIsLoading(false);
    }
  };

  const loadWordDetails = async (wordId: number) => {
    if (wordDetails.has(wordId)) return;

    try {
      const details = await databaseService.getWordWithMeanings(wordId);
      setWordDetails(prev => new Map(prev.set(wordId, details)));
    } catch (error) {
      console.error("Error loading word details:", error);
    }
  };

  const toggleWordExpansion = (wordId: number) => {
    const newExpanded = new Set(expandedWords);
    if (newExpanded.has(wordId)) {
      newExpanded.delete(wordId);
    } else {
      newExpanded.add(wordId);
      loadWordDetails(wordId);
    }
    setExpandedWords(newExpanded);
  };

  const playPronunciation = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      toast.error("Speech synthesis not supported in this browser");
    }
  };

  const handleDeleteWord = async () => {
    if (wordToDelete) {
      try {
        await databaseService.deleteWord(wordToDelete.id);
        toast.success(`"${wordToDelete.text}" has been deleted.`);
        setWordToDelete(null);
      } catch (error) {
        console.error("Error deleting word:", error);
        toast.error("Failed to delete the word.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              My Vocabulary
            </h1>
            <p className="text-lg text-gray-600">
              Manage and review your saved words ({words.length} total)
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search your vocabulary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Words List */}
          {filteredWords.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? "No words found" : "No vocabulary saved yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "Try a different search term" 
                  : "Start building your vocabulary by adding some words!"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => window.location.href = "/"} className="bg-green-600 hover:bg-green-700">
                  Add Your First Word
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredWords.map((word) => (
                <Card key={word.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {word.text}
                        </h3>
                        {word.phonetic && (
                          <span className="text-lg text-blue-600 font-mono">
                            {word.phonetic}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playPronunciation(word.text)}
                          className="p-2"
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWordToDelete(word)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => toggleWordExpansion(word.id)}
                      >
                        {expandedWords.has(word.id) ? "Hide Details" : "Show Details"}
                      </Button>
                    </div>

                    {expandedWords.has(word.id) && wordDetails.has(word.id) && (
                      <div className="space-y-4">
                        {wordDetails.get(word.id)?.meanings?.map((meaning: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="mb-3">
                              <Badge variant="secondary" className="mb-2">
                                {meaning.partOfSpeech}
                              </Badge>
                              <p className="text-gray-900 font-medium mb-2">
                                {meaning.englishDefinition}
                              </p>
                              <p className="text-blue-700 font-medium">
                                🇰🇷 {meaning.koreanTranslation}
                              </p>
                            </div>
                            
                            {meaning.examples?.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Examples:</p>
                                {meaning.examples.map((example: string, exIndex: number) => (
                                  <div key={exIndex} className="text-sm text-gray-600 bg-white p-3 rounded border-l-3 border-green-300 italic">
                                    "{example}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!wordToDelete} onOpenChange={() => setWordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the word
              <span className="font-bold"> "{wordToDelete?.text}" </span>
              and all its associated data from your vocabulary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWord} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyWords;
