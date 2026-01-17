# Project Functionality Overview

## 1. Core Purpose
**Classroom Quiz Master** is a comprehensive, interactive quiz platform designed to bridge the gap between learning and assessment. It allows teachers to host live, multiplayer quiz sessions and enables students to engage in self-paced practice, all wrapped in a premium, secure, and visually engaging environment.

## 2. User Roles & Features

### 👨‍🏫 Teacher (Host)
*   **Dashboard**: A central command center to view, manage, and deploy quizzes.
*   **Quiz Editor**: Create and edit custom quizzes with rich text questions, multiple-choice options, and timer settings.
*   **Live Game Hosting**:
    *   **Session Management**: Generate unique game codes for students to join.
    *   **Flow Control**: Manually advance questions, reveal answers, and show intermediate leaderboards.
    *   **Live Monitoring**: Watch participant counts and scores update in real-time.

### 👨‍🎓 Student (Participant)
*   **Join Live Game**: Enter a 6-character code to join a teacher-led session.
*   **Practice Library**: Access a curated set of self-paced quizzes on topics like:
    *   Machine Learning
    *   SQL Fundamentals
    *   Neural Networks
    *   Version Control (Git)
*   **Performance Review**:
    *   **Instant Feedback**: See correct/incorrect status immediately after answering (in practice mode).
    *   **Detailed Breakdown**: At the end of any quiz (live or practice), review every question with "Your Answer" vs. "Correct Answer" highlights.

## 3. Key Systems & Mechanics

### 🛡️ Advanced Anti-Cheat System
To ensure academic integrity, the platform enforces strict rules:
*   **Fullscreen Enforcement**: Participants must remain in fullscreen mode.
    *   *1st Violation*: Warning.
    *   *2nd Violation*: Removed from the game (Live) or Test Terminated (Practice).
*   **Ban Enforcement**: Players kicked from a live session are locally banned and cannot re-join.
*   **Environment Monitoring**: Requires microphone permissions to deter collaboration/cheating (Camera optional/removed).
*   **Unique Identity**: Enforces unique names per session to prevent impersonation.

### 🎮 Gamification
*   **Live Leaderboard**: Real-time ranking system that rewards both accuracy and speed.
*   **Point System**: Base points for correct answers + speed bonuses.
*   **Visual Rewards**: Confetti celebrations for high scores and game completion.

### 🎨 Visual Experience
*   **3D Dynamic Backgrounds**: Floating, animated 3D shapes (cubes, orbs, pyramids) create a modern, immersive atmosphere.
*   **Glassmorphism Design**: UI elements feature semi-transparent, blurred backgrounds for a sleek, premium look.
*   **Responsive Design**: Fully optimized for desktop and mobile devices.

## 4. Technical Stack
*   **Frontend**: React, TypeScript, Vite, Framer Motion (Animations).
*   **Backend/Database**: Supabase (Real-time subscriptions, Auth, Database).
*   **State Management**: React Context & Hooks.
