import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { m } from 'framer-motion';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <m.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white shadow-sm hover:shadow-md transition-all group"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon size={20} className="group-hover:rotate-12 transition-transform" />
            ) : (
                <Sun size={20} className="group-hover:rotate-90 transition-transform text-orange-400" />
            )}
        </m.button>
    );
}
