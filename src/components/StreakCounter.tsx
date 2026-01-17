import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
    streak: number;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ streak }) => {
    const [showMilestone, setShowMilestone] = useState(false);
    const [milestoneText, setMilestoneText] = useState('');

    useEffect(() => {
        if (streak > 0 && streak % 3 === 0) {
            setShowMilestone(true);
            if (streak === 3) setMilestoneText("Heating Up! 🔥");
            else if (streak === 6) setMilestoneText("On Fire! 🔥🔥");
            else if (streak === 9) setMilestoneText("Unstoppable! 🚀");
            else setMilestoneText(`${streak} in a row! 🏆`);

            const timer = setTimeout(() => setShowMilestone(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [streak]);

    if (streak < 2) return null;

    return (
        <div className="relative flex items-center justify-center">
            <motion.div
                key={streak}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                >
                    <Flame className="text-orange-500 fill-orange-500" size={24} />
                </motion.div>
                <span className="font-bold text-orange-500 text-lg">
                    {streak}
                </span>
            </motion.div>

            <AnimatePresence>
                {showMilestone && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: -40, scale: 1.2 }}
                        exit={{ opacity: 0, y: -60 }}
                        className="absolute whitespace-nowrap font-bold text-xl text-orange-400 drop-shadow-lg"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                        {milestoneText}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
