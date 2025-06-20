
import { useState } from "react";
import { WordInput } from "@/components/WordInput";
import { MeaningsList } from "@/components/MeaningsList";
import { WordMeaning } from "@/types/vocabulary";
import { databaseService } from "@/services/databaseService";
import { toast } from "sonner";

const Index = () => {
  const [meanings, setMeanings] = useState<WordMeaning[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [phonetic, setPhonetic] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleWordFetch = async (word: string, fetchedMeanings: WordMeaning[], phoneticData: string) => {
    setCurrentWord(word);
    setMeanings(fetchedMeanings);
    setPhonetic(phoneticData);
  };

  const handleSaveSelected = async (selectedMeanings: WordMeaning[]) => {
    try {
      // Save the word first
      const wordId = await databaseService.saveWord(currentWord, phonetic);
      
      // Save each selected meaning
      for (const meaning of selectedMeanings) {
        await databaseService.saveMeaning(wordId, meaning);
      }

      toast.success(`Successfully saved "${currentWord}" with ${selectedMeanings.length} meaning(s) to your vocabulary!`);
      
      // Clear the current data after successful save
      setCurrentWord("");
      setMeanings([]);
      setPhonetic("");
    } catch (error) {
      console.error("Error saving vocabulary:", error);
      toast.error("Failed to save vocabulary. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Vocabulary Builder
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter any English word and get comprehensive definitions, translations, 
              examples, and pronunciation data powered by AI
            </p>
          </div>

          {/* Word Input Section */}
          <WordInput 
            onWordFetch={handleWordFetch}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Results Section */}
          {currentWord && meanings.length > 0 && (
            <div className="mt-12">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentWord}
                  </h2>
                  {phonetic && (
                    <p className="text-lg text-blue-600 font-mono">
                      {phonetic}
                    </p>
                  )}
                </div>

                <MeaningsList 
                  meanings={meanings}
                  onSaveSelected={handleSaveSelected}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
