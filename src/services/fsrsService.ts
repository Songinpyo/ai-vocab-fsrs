
// Simplified FSRS (Free Spaced Repetition Scheduler) algorithm implementation

export interface FSRSParams {
  difficulty: number;
  stability: number;
  retrievability: number;
  last_review: string | null;
  next_review: string;
  review_count: number;
}

export enum ReviewResult {
  AGAIN = 1,    // Forgot completely
  HARD = 2,     // Remembered with difficulty
  GOOD = 3,     // Remembered correctly
  EASY = 4      // Remembered very easily
}

class FSRSService {
  private readonly INITIAL_STABILITY = 0.4;
  private readonly DIFFICULTY_DECAY = -0.5;
  private readonly STABILITY_FACTOR = 0.1;

  initializeParams(): FSRSParams {
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1); // Initial review after 1 day

    return {
      difficulty: 0,
      stability: this.INITIAL_STABILITY,
      retrievability: 1,
      last_review: null,
      next_review: nextReview.toISOString(),
      review_count: 0
    };
  }

  calculateNextReview(params: FSRSParams, result: ReviewResult): FSRSParams {
    const now = new Date();
    let { difficulty, stability, retrievability, review_count } = params;

    // Update difficulty based on result
    difficulty = Math.max(0, Math.min(10, difficulty + this.getDifficultyChange(result)));

    // Calculate retrievability based on time elapsed
    if (params.last_review) {
      const elapsed = (now.getTime() - new Date(params.last_review).getTime()) / (1000 * 60 * 60 * 24);
      retrievability = Math.pow(0.9, elapsed / stability);
    }

    // Update stability
    if (result === ReviewResult.AGAIN) {
      stability = Math.max(0.1, stability * 0.2); // Significant decrease
    } else {
      const stabilityIncrease = this.getStabilityIncrease(result, difficulty, retrievability);
      stability = stability * (1 + stabilityIncrease);
    }

    // Calculate next review interval
    const interval = this.calculateInterval(stability, difficulty, result);
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + Math.round(interval));

    return {
      difficulty,
      stability,
      retrievability,
      last_review: now.toISOString(),
      next_review: nextReview.toISOString(),
      review_count: review_count + 1
    };
  }

  private getDifficultyChange(result: ReviewResult): number {
    switch (result) {
      case ReviewResult.AGAIN: return 1.2;
      case ReviewResult.HARD: return 0.3;
      case ReviewResult.GOOD: return -0.1;
      case ReviewResult.EASY: return -0.3;
      default: return 0;
    }
  }

  private getStabilityIncrease(result: ReviewResult, difficulty: number, retrievability: number): number {
    const base = 1 - retrievability;
    const difficultyFactor = Math.exp(this.DIFFICULTY_DECAY * difficulty);
    
    switch (result) {
      case ReviewResult.HARD: return base * 0.5 * difficultyFactor;
      case ReviewResult.GOOD: return base * 1.0 * difficultyFactor;
      case ReviewResult.EASY: return base * 1.5 * difficultyFactor;
      default: return 0;
    }
  }

  private calculateInterval(stability: number, difficulty: number, result: ReviewResult): number {
    if (result === ReviewResult.AGAIN) {
      return 0.25; // Review again in 6 hours
    }

    const baseInterval = stability * Math.log(0.9) / Math.log(0.9);
    const difficultyMultiplier = Math.exp(-0.1 * difficulty);
    
    return Math.max(1, baseInterval * difficultyMultiplier);
  }
}

export const fsrsService = new FSRSService();
