import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, Home, HelpCircle, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAntiCheat, type ViolationType } from '../hooks/useAntiCheat';
import { calculateScore } from '../utils/scoring';
import { ANTI_CHEAT_CONFIG, SCORING_CONFIG } from '../config/performance';

// Local type definitions (previously from database.ts)
interface GameSession {
    id: string;
    quizId: string;
    quizTitle?: string;
    status: 'waiting' | 'playing' | 'question' | 'results' | 'ended';
    currentQuestionIndex: number;
    questionStartedAt: string | null;
}

interface Question {
    id: string;
