
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { geminiService } from "@/services/geminiService";
import { WordMeaning } from "@/types/vocabulary";
import { toast } from "sonner";

interface WordInputProps {
  onWordFetch: (word: string, meanings: WordMeaning[], phonetic: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const WordInput = ({ onWordFetch, isLoading, setIsLoading }: WordInputProps) => {
  const [word, setWord] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!word.trim()) {
      toast.error("Please enter a word");
      return;
    }

    setIsLoading(true);
    
    try {
      const wordData = await geminiService.fetchWordData(word.trim().toLowerCase());
      onWordFetch(wordData.word, wordData.meanings, wordData.phonetic);
      toast.success("Word data fetched successfully!");
    } catch (error) {
      console.error("Error fetching word data:", error);
      toast.error("Failed to fetch word data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="word-input" className="block text-sm font-medium text-gray-700 mb-2">
            Enter an English word
          </label>
          <div className="flex gap-3">
            <Input
              id="word-input"
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g., conduct, elaborate, magnificent..."
              className="flex-1 text-lg py-3 px-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !word.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Fetch Info
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>💡 This will fetch comprehensive information including:</p>
          <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
            <li>Multiple definitions and meanings</li>
            <li>Korean translations</li>
            <li>Example sentences</li>
            <li>Pronunciation (IPA)</li>
          </ul>
        </div>
      </form>
    </div>
  );
};
