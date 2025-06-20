import { WordMeaning, SavedWord, SavedMeaning, SavedExample } from "@/types/vocabulary";
import { fsrsService, ReviewResult, FSRSParams } from "./fsrsService";

// Mock database service that simulates SQLite operations
// In a real implementation, this would use sql.js or a similar library

class LocalDatabaseService {
  private words: SavedWord[] = [];
  private meanings: SavedMeaning[] = [];
  private examples: SavedExample[] = [];
  private nextWordId = 1;
  private nextMeaningId = 1;
  private nextExampleId = 1;
  private eventTarget = new EventTarget();

  constructor() {
    this.loadFromLocalStorage();
  }

  // Methods for event handling to allow components to react to data changes
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null) {
    this.eventTarget.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null) {
    this.eventTarget.removeEventListener(type, listener);
  }

  private dispatchChangeEvent() {
    this.eventTarget.dispatchEvent(new Event('datachanged'));
  }

  private loadFromLocalStorage() {
    const wordsData = localStorage.getItem('vocabulary_words');
    const meaningsData = localStorage.getItem('vocabulary_meanings');
    const examplesData = localStorage.getItem('vocabulary_examples');

    if (wordsData) this.words = JSON.parse(wordsData);
    if (meaningsData) this.meanings = JSON.parse(meaningsData);
    if (examplesData) this.examples = JSON.parse(examplesData);

    // Update next IDs
    this.nextWordId = Math.max(0, ...this.words.map(w => w.id)) + 1;
    this.nextMeaningId = Math.max(0, ...this.meanings.map(m => m.id)) + 1;
    this.nextExampleId = Math.max(0, ...this.examples.map(e => e.id)) + 1;
  }

  private saveToLocalStorage() {
    localStorage.setItem('vocabulary_words', JSON.stringify(this.words));
    localStorage.setItem('vocabulary_meanings', JSON.stringify(this.meanings));
    localStorage.setItem('vocabulary_examples', JSON.stringify(this.examples));
    this.dispatchChangeEvent(); // Notify listeners that data has changed
  }

  async saveWord(word: string, phonetic: string): Promise<number> {
    // Check if word already exists
    const existingWord = this.words.find(w => w.text.toLowerCase() === word.toLowerCase());
    if (existingWord) {
      return existingWord.id;
    }

    const newWord: SavedWord = {
      id: this.nextWordId++,
      text: word,
      phonetic: phonetic,
      createdAt: new Date().toISOString(),
      fsrs_params: JSON.stringify({
        difficulty: 0,
        stability: 0,
        retrievability: 1,
        last_review: null,
        next_review: new Date().toISOString()
      })
    };

    this.words.push(newWord);
    this.saveToLocalStorage();
    return newWord.id;
  }

  async saveMeaning(wordId: number, meaning: WordMeaning): Promise<number> {
    const newMeaning: SavedMeaning = {
      id: this.nextMeaningId++,
      word_id: wordId,
      partOfSpeech: meaning.partOfSpeech,
      englishDefinition: meaning.englishDefinition,
      koreanTranslation: meaning.koreanTranslation
    };

    this.meanings.push(newMeaning);

    // Save examples
    for (const sentence of meaning.exampleSentences) {
      await this.saveExample(newMeaning.id, sentence);
    }

    this.saveToLocalStorage();
    return newMeaning.id;
  }

  async saveExample(meaningId: number, sentence: string): Promise<void> {
    const newExample: SavedExample = {
      id: this.nextExampleId++,
      meaning_id: meaningId,
      sentence: sentence
    };

    this.examples.push(newExample);
    this.saveToLocalStorage();
  }

  async getWeeklyProgressData(): Promise<Array<{ day: string; reviewed: number; learned: number }>> {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const dayStrings = last7Days.map(d => d.toLocaleString('en-US', { weekday: 'short' }));
    
    const weeklyData = dayStrings.map(day => ({ day, learned: 0, reviewed: 0 }));

    this.words.forEach(word => {
      // Count learned words
      const createdAt = new Date(word.createdAt);
      const dayDiff = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
      if (dayDiff >= 0 && dayDiff < 7) {
        const dayIndex = 6 - dayDiff;
        if (weeklyData[dayIndex]) {
          weeklyData[dayIndex].learned++;
        }
      }

      // Count reviewed words
      if (word.fsrs_params) {
        try {
          const params = JSON.parse(word.fsrs_params);
          if (params.last_review) {
            const lastReview = new Date(params.last_review);
            const reviewDayDiff = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 3600 * 24));
            if (reviewDayDiff >= 0 && reviewDayDiff < 7) {
              const dayIndex = 6 - reviewDayDiff;
              if (weeklyData[dayIndex]) {
                weeklyData[dayIndex].reviewed++;
              }
            }
          }
        } catch (e) {
          console.error("Error parsing FSRS params for weekly progress:", e);
        }
      }
    });

    return weeklyData;
  }

  async getWordsForPractice(limit: number = 20): Promise<SavedWord[]> {
    if (this.words.length === 0) {
      return [];
    }

    const now = new Date();
    const due: SavedWord[] = [];
    const learning: SavedWord[] = [];
    const fresh: SavedWord[] = []; // 'new' is a reserved keyword
    const mastered: SavedWord[] = [];

    for (const word of this.words) {
      if (word.fsrs_params) {
        try {
          const params = JSON.parse(word.fsrs_params);
          if (params.stability === 0) {
            fresh.push(word);
          } else if (new Date(params.next_review) <= now) {
            due.push(word);
          } else if (params.stability > 0 && params.stability <= 30) {
            learning.push(word);
          } else {
            mastered.push(word);
          }
        } catch {
          mastered.push(word); // Treat parse errors as mastered for safety
        }
      } else {
        fresh.push(word); // Words without params are new
      }
    }

    // Create a weighted pool of candidates. Words that are more critical for learning
    // are added more times, increasing their probability of being selected.
    const weightedPool: SavedWord[] = [];
    due.forEach(word => { for(let i = 0; i < 4; i++) weightedPool.push(word) });
    learning.forEach(word => { for(let i = 0; i < 3; i++) weightedPool.push(word) });
    fresh.forEach(word => { for(let i = 0; i < 2; i++) weightedPool.push(word) });
    mastered.forEach(word => { for(let i = 0; i < 1; i++) weightedPool.push(word) });
    
    // Shuffle the weighted pool to randomize the order
    const shuffledPool = weightedPool.sort(() => Math.random() - 0.5);

    // Pick unique words from the shuffled pool up to the limit
    const finalSelection: SavedWord[] = [];
    const selectedIds = new Set<number>();
    for (const word of shuffledPool) {
      if (!selectedIds.has(word.id)) {
        finalSelection.push(word);
        selectedIds.add(word.id);
        if (finalSelection.length >= limit) {
          break;
        }
      }
    }

    return finalSelection;
  }

  async calculateStreakDays(): Promise<number> {
    const reviewDates = this.words
        .map(word => {
            if (!word.fsrs_params) return null;
            try {
                const params = JSON.parse(word.fsrs_params);
                return params.last_review ? new Date(params.last_review) : null;
            } catch {
                return null;
            }
        })
        .filter((date): date is Date => date !== null);

    if (reviewDates.length === 0) {
        return 0;
    }

    // Get unique dates (day-level precision)
    const uniqueDayStrings = new Set<string>();
    reviewDates.forEach(date => {
        uniqueDayStrings.add(date.toDateString());
    });

    const uniqueDates = Array.from(uniqueDayStrings).map(dateStr => new Date(dateStr));

    // Sort dates descending
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentReviewDate = uniqueDates[0];

    // If the last review wasn't today or yesterday, streak is 0.
    if (mostRecentReviewDate.toDateString() !== today.toDateString() && mostRecentReviewDate.toDateString() !== yesterday.toDateString()) {
        return 0;
    }

    let streak = 1;
    let currentDay = mostRecentReviewDate;

    for (let i = 1; i < uniqueDates.length; i++) {
        const previousDay = uniqueDates[i];
        const expectedPreviousDay = new Date(currentDay);
        expectedPreviousDay.setDate(expectedPreviousDay.getDate() - 1);

        if (previousDay.toDateString() === expectedPreviousDay.toDateString()) {
            streak++;
            currentDay = previousDay;
        } else {
            // Streak is broken
            break;
        }
    }

    return streak;
  }

  async getAllWords(): Promise<SavedWord[]> {
    return [...this.words];
  }

  async getWordWithMeanings(wordId: number): Promise<any> {
    const word = this.words.find(w => w.id === wordId);
    if (!word) return null;

    const wordMeanings = this.meanings.filter(m => m.word_id === wordId);
    const meaningsWithExamples = await Promise.all(
      wordMeanings.map(async (meaning) => {
        const examples = this.examples.filter(e => e.meaning_id === meaning.id);
        return {
          ...meaning,
          examples: examples.map(e => e.sentence)
        };
      })
    );

    return {
      ...word,
      meanings: meaningsWithExamples
    };
  }

  async updateFSRSParams(wordId: number, params: any): Promise<void> {
    const word = this.words.find(w => w.id === wordId);
    if (word) {
      word.fsrs_params = JSON.stringify(params);
      this.saveToLocalStorage();
    }
  }

  async getWordsForReview(): Promise<SavedWord[]> {
    const now = new Date();
    return this.words.filter(word => {
      if (!word.fsrs_params) return true;
      
      try {
        const params = JSON.parse(word.fsrs_params);
        const nextReview = new Date(params.next_review);
        return nextReview <= now;
      } catch {
        return true;
      }
    });
  }

  async recordReview(wordId: number, result: ReviewResult): Promise<void> {
    const word = this.words.find(w => w.id === wordId);
    if (!word) {
      console.error(`Word with id ${wordId} not found for review.`);
      return;
    }

    try {
      const currentParams: FSRSParams = word.fsrs_params
        ? JSON.parse(word.fsrs_params)
        : fsrsService.initializeParams();
      
      // Cooldown: Skip FSRS update if the word was reviewed very recently
      const now = new Date();
      if (currentParams.last_review) {
        const lastReviewDate = new Date(currentParams.last_review);
        const minutesSinceLastReview = (now.getTime() - lastReviewDate.getTime()) / (1000 * 60);
        
        // A 50-minute cooldown period to prevent gaming the system
        if (minutesSinceLastReview < 50) {
          console.log(`Practice review for word ID ${wordId}. FSRS update skipped due to cooldown.`);
          return; // Don't update FSRS if reviewed too recently
        }
      }

      const newParams = fsrsService.calculateNextReview(currentParams, result);

      await this.updateFSRSParams(wordId, newParams);
    } catch (error) {
      console.error(`Error recording review for word ${wordId}:`, error);
      throw new Error("Failed to update FSRS parameters.");
    }
  }

  async deleteWord(wordId: number): Promise<void> {
    const meaningsToDelete = this.meanings.filter(m => m.word_id === wordId);
    const meaningIdsToDelete = new Set(meaningsToDelete.map(m => m.id));

    // Filter out the deleted items
    this.words = this.words.filter(w => w.id !== wordId);
    this.meanings = this.meanings.filter(m => m.word_id !== wordId);
    this.examples = this.examples.filter(e => !meaningIdsToDelete.has(e.meaning_id));
    
    this.saveToLocalStorage(); // This will also dispatch the 'datachanged' event
  }
}

export const databaseService = new LocalDatabaseService();
