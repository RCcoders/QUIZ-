export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  avatarUrl?: string | null;
  createdAt: string; // ISO timestamp
  streak: number;
  lastActiveDate: string; // ISO date YYYY-MM-DD
  notificationPrefs?: {
    newQuizInSubject: boolean;
  };
  defaultSubject?: string | null; // teacher only
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  authorUid: string;
  linkedQuizId: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BadgeId =
  | 'first_quiz'
  | 'streak_3'
  | 'streak_7'
  | 'perfect_score'
  | 'high_achiever'
  | 'improvement';

export interface BadgeRecord {
  badgeId: BadgeId;
  awardedAt: string;   // ISO timestamp
  quizId: string | null;
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
