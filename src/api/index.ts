const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = VITE_API_URL.endsWith('/api') ? VITE_API_URL : `${VITE_API_URL.replace(/\/$/, '')}/api`;

const getAuthToken = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        return token;
    }
    return null;
};

const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || response.statusText);
    }

    return response.json();
};

export const authApi = {
    login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const quizApi = {
    create: (data: any) => request('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
    getTeacherQuizzes: (teacherId: string) => request(`/quizzes/teacher/${teacherId}`),
    getAllQuizzes: () => request('/quizzes'),
    getQuiz: (id: string) => request(`/quizzes/${id}`),
};

export const sessionApi = {
    host: (data: { quizId: string; teacherId: string }) => request('/sessions/host', { method: 'POST', body: JSON.stringify(data) }),
    join: (data: { gameCode: string; name: string; userId?: string }) => request('/sessions/join', { method: 'POST', body: JSON.stringify(data) }),
    getByCode: (code: string) => request(`/sessions/code/${code}`),
    getStatus: (id: string) => request(`/sessions/${id}`),
    updateStatus: (id: string, data: { status?: string; currentQuestionIndex?: number }) => request(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    submitAnswer: (id: string, data: { participantId: string; pointsEarned: number }) => request(`/sessions/${id}/answer`, { method: 'POST', body: JSON.stringify(data) }),
};

export default request;
