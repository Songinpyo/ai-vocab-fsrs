
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WordMeaning } from "@/types/vocabulary";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface MeaningsListProps {
  meanings: WordMeaning[];
  onSaveSelected: (selectedMeanings: WordMeaning[]) => void;
}

export const MeaningsList = ({ meanings, onSaveSelected }: MeaningsListProps) => {
  const [selectedMeanings, setSelectedMeanings] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Reset selections when meanings change
    setSelectedMeanings(new Set());
  }, [meanings]);

  const handleMeaningToggle = (index: number) => {
    const newSelected = new Set(selectedMeanings);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMeanings(newSelected);
  };

  const handleSaveSelected = () => {
    const selected = meanings.filter((_, index) => selectedMeanings.has(index));
    if (selected.length === 0) {
      toast.error("Please select at least one meaning to save");
      return;
    }
    
    onSaveSelected(selected);
    toast.success(`Saved ${selected.length} meaning(s) to your vocabulary!`);
  };

  const getPartOfSpeechColor = (pos: string) => {
    const colors: Record<string, string> = {
      noun: "bg-blue-100 text-blue-800",
      verb: "bg-green-100 text-green-800",
      adjective: "bg-purple-100 text-purple-800",
      adverb: "bg-orange-100 text-orange-800",
      preposition: "bg-gray-100 text-gray-800",
      conjunction: "bg-pink-100 text-pink-800",
      interjection: "bg-yellow-100 text-yellow-800",
    };
    return colors[pos.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Select meanings to save ({selectedMeanings.size} selected)
        </h3>
        <Button
          onClick={handleSaveSelected}
          disabled={selectedMeanings.size === 0}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Selected
        </Button>
      </div>

      <div className="space-y-4">
        {meanings.map((meaning, index) => (
          <Card 
            key={index}
            className={`transition-all duration-200 border-2 cursor-pointer hover:shadow-md ${
              selectedMeanings.has(index) 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleMeaningToggle(index)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={selectedMeanings.has(index)}
                  onChange={() => handleMeaningToggle(index)}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge variant="secondary" className={getPartOfSpeechColor(meaning.partOfSpeech)}>
                        {meaning.partOfSpeech}
                      </Badge>
                      <p className="text-gray-900 font-medium leading-relaxed">
                        {meaning.englishDefinition}
                      </p>
                      <p className="text-blue-700 font-medium">
                        🇰🇷 {meaning.koreanTranslation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Example sentences:</p>
                    <div className="space-y-1">
                      {meaning.exampleSentences.map((sentence, sentenceIndex) => (
                        <div 
                          key={sentenceIndex}
                          className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic border-l-3 border-gray-300"
                        >
                          "{sentence}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
