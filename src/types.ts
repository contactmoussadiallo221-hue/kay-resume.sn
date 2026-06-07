export interface Definition {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Summary {
  id: string;
  userId: string;
  title: string;
  subject: string; // e.g. "Mathématiques", "Physique-Chimie", "SVT / Biologie", "Histoire-Géographie", "Français / Littérature", "Autre"
  difficulty: string; // "primary" | "college" | "lycee" | "uni"
  originalText?: string;
  summaryText: string;
  keyPoints: string[];
  definitions: Definition[];
  formulasOrDates: string[];
  simplification: string;
  quiz: QuizQuestion[];
  createdAt: string; // ISO String
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
}
