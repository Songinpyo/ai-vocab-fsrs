
import { WordData } from "@/types/vocabulary";

class GeminiService {
  private apiKey: string | null = null;
  private model: string = 'gemini-2.0-flash-lite';

  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_model');
    if (savedModel) {
      this.model = savedModel;
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
  }

  setModel(model: string) {
    this.model = model;
    localStorage.setItem('gemini_model', model);
  }

  getModel() {
    return this.model;
  }

  private createPrompt(word: string): string {
    return `For the English word "${word}", provide a comprehensive vocabulary entry in a structured JSON format. The root object should contain the key "phonetic" with the IPA transcription. It must also contain a key "meanings" which is an array of objects. Each object in this array represents a distinct meaning and must have the following keys:

"partOfSpeech": The part of speech (e.g., "verb", "noun", "adjective").
"englishDefinition": A clear, concise definition in English.
"koreanTranslation": The most appropriate Korean translation for this specific definition.
"exampleSentences": An array of at least 2 modern, high-quality English example sentences that clearly demonstrate the usage of the word for this specific meaning.

Respond ONLY with valid JSON, no additional text or formatting. The JSON should follow this exact structure:

{
  "word": "${word}",
  "phonetic": "/example/",
  "meanings": [
    {
      "partOfSpeech": "example",
      "englishDefinition": "example definition",
      "koreanTranslation": "예시 번역",
      "exampleSentences": [
        "First example sentence.",
        "Second example sentence."
      ]
    }
  ]
}`;
  }

  async fetchWordData(word: string): Promise<WordData> {
    if (!this.apiKey) {
      throw new Error("Gemini API key is required. Please set it in Settings first.");
    }

    const prompt = this.createPrompt(word);
    
    console.log("Calling Gemini API with model:", this.model);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Please check your API key.`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API");
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean and parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const wordData = JSON.parse(cleanedText);
      return wordData;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to parse AI response. Please try again.");
    }
  }
}

export const geminiService = new GeminiService();
