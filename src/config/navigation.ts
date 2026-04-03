import { LayoutDashboard, BookOpen, BarChart2, Library } from 'lucide-react';

export const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
    { icon: BookOpen, label: 'My Quizzes', path: '/teacher/my-quizzes' },
    { icon: BarChart2, label: 'Reports', path: '/teacher/reports' },
    { icon: Library, label: 'Library', path: '/teacher/library' },
];
