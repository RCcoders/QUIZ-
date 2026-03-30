import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = VITE_API_URL.endsWith('/api') ? VITE_API_URL : `${VITE_API_URL.replace(/\/$/, '')}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data: any) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
};

export const quizApi = {
    create: (data: any) => api.post('/quizzes', data),
    getTeacherQuizzes: (teacherId: string) => api.get(`/quizzes/teacher/${teacherId}`),
    getAllQuizzes: () => api.get('/quizzes'),
    getQuiz: (id: string) => api.get(`/quizzes/${id}`),
};


export const sessionApi = {
    host: (data: { quizId: string; teacherId: string }) => api.post('/sessions/host', data),
    join: (data: { gameCode: string; name: string; userId?: string }) => api.post('/sessions/join', data),
    getByCode: (code: string) => api.get(`/sessions/code/${code}`),
    getStatus: (id: string) => api.get(`/sessions/${id}`),
    updateStatus: (id: string, data: { status?: string; currentQuestionIndex?: number }) => api.patch(`/sessions/${id}`, data),
    submitAnswer: (id: string, data: { participantId: string; pointsEarned: number }) => api.post(`/sessions/${id}/answer`, data),
};



export default api;
