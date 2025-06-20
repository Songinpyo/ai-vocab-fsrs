# AI Vocabulary: Your Personalized Learning Companion

AI-powered vocabulary app with automatic word capture and FSRS-based spaced repetition.

This is a local-first, AI-powered vocabulary learning application designed to provide a personalized and effective study experience. By leveraging the **FSRS (Free Spaced Repetition Scheduler)** algorithm, the app adapts to your unique memory patterns to create the most optimal review schedule for long-term retention.

## ✨ Core Features

- **🧠 AI-Powered Word Registration**: Simply enter an English word, and the application uses the Gemini API to automatically fetch its phonetic transcription, multiple meanings (with parts of speech), and high-quality Korean translations and example sentences.
- **📈 Personalized Spaced Repetition**: At its core, the app uses the FSRS algorithm. It doesn't just show you random words; it precisely schedules reviews for the moment you are most likely to forget, maximizing learning efficiency.
- **🎮 Smart Interactive Learning**: Learning activities are more than just fun. Quizzes and games intelligently select words that need practice—whether they are new, currently being learned, or due for review—and your performance in them directly updates your learning schedule.
- **📊 Comprehensive Learning Analytics**: Visualize your progress through a dashboard tracking your total vocabulary, retention rate, and **daily study streak**.
- **🗺️ Visual Knowledge Map**: Get a bird's-eye view of your entire vocabulary, with each word visually categorized as `New`, `Learning`, or `Mastered` based on its strength in your memory.
- **🔒 Local-First & Privacy-Focused**: All your learning data is stored locally on your device. An internet connection is only required for the initial AI-powered word registration.

---

## 🚀 How to Use AI Vocabulary

This app is designed to be your daily companion for building a robust vocabulary. Here's a typical user journey:

### 1. ➕ Add a New Word
Your journey begins at the `Add Words` tab. Enter a single English word and let the AI do the heavy lifting. It will fetch all the necessary information. You simply review and select the meanings you want to learn, and they are saved to your personal vocabulary.

### 2. 🧠 Study Your Words
This is the heart of your learning. The `Study` tab presents you with words that the FSRS algorithm has determined are most critical for you to review *right now*.
- **The Process**: For each word, recall its meaning, then click `Show Meanings` to verify.
- **Your Feedback is Crucial**: After seeing the answer, rate your recall ability:
  - <kbd>Again</kbd>: If you completely forgot.
  - <kbd>Hard</kbd>: If you struggled to remember.
  - <kbd>Good</kbd>: If you remembered it correctly.
  - <kbd>Easy</kbd>: If you recalled it instantly.
  This direct feedback is the most powerful way to fine-tune your personal learning model.
- **Repeat Today's Session**: After finishing a session, you can immediately repeat all the words you've studied that day to solidify your memory.

### 3. 🎮 Play to Reinforce
The `Games` and `Quiz` tabs are powerful tools for reinforcing what you've learned in a fun, low-pressure environment.
- **Intelligent Word Selection**: These modes don't just pick random words. They use a **weighted-random algorithm** to prioritize words that are `Due`, `Learning`, or `New`, while still occasionally showing `Mastered` words to ensure they haven't been forgotten.
- **Automatic Feedback**: Your performance here also updates your FSRS schedule. A correct answer is treated as `Good`, and an incorrect answer as `Hard`.

### 4. 📖 Manage Your Vocabulary (`My Words`)
This section acts as your complete, personal dictionary. You can search for words, review their meanings and example sentences, and—importantly—**delete** any words you no longer wish to study.

### 5. 📈 Track Your Progress (`Statistics` & `Knowledge Map`)
- **Statistics**: See your total word count, overall retention rate, and your **consecutive daily study streak** to stay motivated.
- **Knowledge Map**: This screen visualizes the strength of every word in your memory:
  - **`New`**: A word added but not yet studied.
  - **`Learning`**: A word you've studied at least once and is actively being scheduled.
  - **`Mastered`**: A word that is firmly in your long-term memory.

---

## ⚙️ The FSRS Learning System

Your entire learning experience is driven by the FSRS algorithm. Every time you interact with a word in `Study`, `Games`, or `Quiz`, the system updates its understanding of your memory.

### How Your Actions Impact Your Schedule

| Activity | User Action | System Interpretation | Impact on Your Schedule |
| :--- | :--- | :--- | :--- |
| **Study Session** | <kbd>Again</kbd> | You completely forgot the word. | `Difficulty` increases significantly. The word will be shown for review **very soon**. |
| (Direct Feedback) | <kbd>Hard</kbd> | You struggled to remember it. | `Difficulty` increases. The word will be shown **sooner** than planned. |
| | <kbd>Good</kbd> | You remembered it correctly. | This is the baseline for success. The review interval extends appropriately. |
| | <kbd>Easy</kbd> | You remembered it with no effort. | `Difficulty` decreases. The review interval extends **significantly**. |
| | | | |
| **Quiz / Game** | **Correct Answer** | You successfully recalled the word. | Interpreted as **`Good`**. The review interval extends. |
| (Indirect Feedback) | **Incorrect Answer** | You had trouble recalling the word. | Interpreted as **`Hard`**. The word will appear for review sooner. |

> **Note on Rapid Repetition**: To ensure the integrity of your long-term learning schedule, the system includes a **50-minute cooldown**.If you review the same word multiple times within this window (e.g., by repeating a session), only the first review will update your FSRS scores. Subsequent reviews are treated as practice, allowing you to drill without distorting your learning data.

<details>
<summary>🔬 Click here for a detailed look at the FSRS calculations</summary>

The FSRS algorithm calculates the next review date based on three primary components: **Retrievability**, **Difficulty**, and **Stability**.

1.  **Retrievability (R)**
    - **What it is:** The probability that you will successfully recall a word at a given moment. It ranges from 0% to 100%.
    - **How it's calculated:** When you review a word, the system first calculates its theoretical retrievability just before you see it. This is based on the time elapsed since the last review (`t`, in days) and its current stability (`S`):
      `R = 0.9 ^ (t / S)`
    - **Impact:** A lower retrievability (e.g., you were just about to forget it) leads to a much larger increase in stability if you successfully recall the word.

2.  **Difficulty (D)**
    - **What it is:** The inherent difficulty of a word *for you*. A higher value means you find the word harder.
    - **How it's updated:** Difficulty is adjusted based on your direct feedback in the `Study` session. The system adds a value based on your rating:
      - `Again`: +1.2
      - `Hard`: +0.3
      - `Good`: -0.1
      - `Easy`: -0.3
    - **Impact:** Difficulty acts as a multiplier. Higher difficulty slightly dampens the increase in stability, meaning harder words need more frequent reviews to become stable in memory.

3.  **Stability (S)**
    - **What it is:** A measure of how long a word is likely to stay in your memory before you forget it. This is the key to determining the review interval.
    - **How it's updated:** This is the most critical calculation. After a review, the new stability (`S'`) is calculated based on the old stability (`S`), difficulty (`D`), retrievability (`R`), and your performance (`result`):
      - If you press **`Again`**, your stability is reset to a much lower value.
      - Otherwise, the increase depends on how hard it was to remember:
        `S' = S * (1 + stabilityIncreaseFactor)`
        The `stabilityIncreaseFactor` is larger when:
        - Retrievability (`R`) was low (you were close to forgetting).
        - Difficulty (`D`) is low (the word is generally easy for you).
        - Your rating was `Easy` or `Good`.

4.  **Next Review Interval**
    - Finally, the system uses the new Stability (`S'`) to calculate the number of days until the next review. The core idea is to schedule the next review when your retrievability is predicted to fall to 90%.

This continuous, feedback-driven calculation ensures that the review schedule is always tailored to your precise memory state for every single word.

</details>

---

## 🛠️ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your API Key:**
    - The app uses the Google Gemini API to fetch word information.
    - Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
    - Launch the app and navigate to the **Settings** page to enter and save your API key.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Now you are all set to start building your personalized vocabulary list!
