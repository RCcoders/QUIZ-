# Classroom Quiz Master

A real-time, interactive quiz platform for classrooms, similar to Kahoot!

## Features

-   **Teacher Dashboard**: Create, manage, and host quizzes.
-   **AI-Powered**: Generate questions automatically using AI.
-   **Live Games**: Real-time gameplay with students joining via code/QR.
-   **Gamification**: Leaderboards, podiums, and sound effects.
-   **Student Interface**: Mobile-friendly interface for answering questions.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite, Framer Motion
-   **Backend**: Supabase (Database, Realtime, Auth)
-   **Styling**: Custom CSS Design System

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd classroom-quiz-master
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Supabase Setup:**
    -   Create a new project on [Supabase](https://supabase.com/).
    -   Go to the SQL Editor and run the contents of `supabase-schema.sql` (or `supabase-schema-fix.sql` if issues arise).
    -   This will create the necessary tables and policies.

4.  **Environment Variables:**
    -   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Fill in your Supabase credentials in `.env`:
        ```env
        VITE_SUPABASE_URL=your_supabase_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        ```

### Running the App

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Open in browser:**
    -   Visit `http://localhost:5173`

## Building for Production

To build the application for production:

```bash
npm run build
```

The output will be in the `dist` directory.
