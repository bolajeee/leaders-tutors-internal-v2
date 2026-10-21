export interface PracticeQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
}

/** Mock-mode CBT practice sets, keyed by lesson id. */
export const practiceQuestions: Record<string, PracticeQuestion[]> = {
  "living-things": [
    { id: "lt-1", prompt: "Which of these is a living thing?", options: ["A stone", "A mango tree", "A chair"], answer: 1, explanation: "Living things grow, feed, respond and reproduce." },
    { id: "lt-2", prompt: "Which characteristic do all living things share?", options: ["They reproduce", "They are green", "They have legs"], answer: 0, explanation: "Reproduction is one of the characteristics of living things." },
    { id: "lt-3", prompt: "Non-living things can...", options: ["Grow by feeding", "Respond to stimuli", "Not carry out life processes"], answer: 2, explanation: "Non-living things do not carry out life processes." },
  ],
  energy: [
    { id: "en-1", prompt: "A battery stores which form of energy?", options: ["Chemical energy", "Sound energy", "Light energy"], answer: 0, explanation: "Batteries store chemical energy and release it as electrical energy." },
    { id: "en-2", prompt: "A bulb changes electrical energy mainly into...", options: ["Light and heat", "Sound", "Chemical energy"], answer: 0, explanation: "A bulb gives out light and some heat." },
    { id: "en-3", prompt: "Energy can be...", options: ["Created from nothing", "Changed from one form to another", "Destroyed completely"], answer: 1, explanation: "Energy changes form but is conserved." },
  ],
  "whole-numbers": [
    { id: "wn-1", prompt: "Which number is the greatest?", options: ["9,099", "9,990", "9,909"], answer: 1, explanation: "Compare the hundreds digit first: 9,990 is greatest." },
    { id: "wn-2", prompt: "What is 4,000 + 300 + 5?", options: ["4,035", "4,305", "4,350"], answer: 1, explanation: "4,000 + 300 + 5 = 4,305." },
    { id: "wn-3", prompt: "Which list is in ascending order?", options: ["12, 9, 15", "9, 12, 15", "15, 12, 9"], answer: 1, explanation: "Ascending means smallest to largest." },
  ],
  fractions: [
    { id: "fr-1", prompt: "Which fraction is equal to one half?", options: ["2/4", "1/3", "3/5"], answer: 0, explanation: "2/4 simplifies to 1/2." },
    { id: "fr-2", prompt: "Which is greater?", options: ["1/4", "3/4", "They are equal"], answer: 1, explanation: "With the same denominator, the larger numerator is greater." },
    { id: "fr-3", prompt: "In 3/8, the denominator is...", options: ["3", "8", "11"], answer: 1, explanation: "The denominator shows how many equal parts make the whole." },
  ],
  perimeter: [
    { id: "pa-1", prompt: "The perimeter of a square with side 5 cm is...", options: ["10 cm", "20 cm", "25 cm"], answer: 1, explanation: "4 × 5 = 20 cm." },
    { id: "pa-2", prompt: "Area of a rectangle 6 cm by 3 cm is...", options: ["9 cm²", "18 cm²", "12 cm²"], answer: 1, explanation: "6 × 3 = 18 cm²." },
    { id: "pa-3", prompt: "Perimeter measures...", options: ["The space inside a shape", "The distance around a shape", "The height of a shape"], answer: 1, explanation: "Perimeter is the distance around." },
  ],
  "parts-of-speech": [
    { id: "ps-1", prompt: "In 'Ada sings loudly', 'loudly' is a...", options: ["Noun", "Verb", "Adverb"], answer: 2, explanation: "Adverbs describe how an action is done." },
    { id: "ps-2", prompt: "Which word is a noun?", options: ["Quickly", "Teacher", "Beautiful"], answer: 1, explanation: "A noun names a person, place or thing." },
    { id: "ps-3", prompt: "Which word is an adjective?", options: ["Run", "Happy", "School"], answer: 1, explanation: "Adjectives describe nouns." },
  ],
};

export const getPracticeQuestions = (lessonId: string) => practiceQuestions[lessonId] ?? [];
