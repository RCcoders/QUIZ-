export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  avatarUrl?: string;
  createdAt: string; // ISO timestamp
  streak: number;
  lastActiveDate: string; // ISO date YYYY-MM-DD
}

export interface ScoreRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;       // correct answers count
  total: number;       // total questions
  percentage: number;  // 0–100
  completedAt: string; // ISO timestamp
  subject?: string;    // optional subject tag
  timeTakenMs?: number; // optional duration in ms
}
