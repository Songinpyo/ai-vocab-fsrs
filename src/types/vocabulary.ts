export interface WordMeaning {
  id?: string;
  partOfSpeech: string;
  englishDefinition: string;
  koreanTranslation: string;
  exampleSentences: string[];
  selected?: boolean;
}

export interface WordData {
  word: string;
  phonetic: string;
  meanings: WordMeaning[];
}

export interface SavedWord {
  id: number;
  text: string;
  phonetic: string;
  createdAt: string;
  fsrs_params?: string;
}

export interface SavedMeaning {
  id: number;
  word_id: number;
  partOfSpeech: string;
  englishDefinition: string;
  koreanTranslation: string;
}

export interface SavedExample {
  id: number;
  meaning_id: number;
  sentence: string;
}

export interface FSRSCard {
  difficulty: number;
  stability: number;
  retrievability: number;
  last_review: Date | null;
  next_review: Date;
  review_count: number;
}

export enum Grade {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4
}
