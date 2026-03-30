export const getAuthToken = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
        const user = JSON.parse(userJson);
        return user.token;
    } catch (e) {
        return null;
    }
};

export const apiFetch = async (endpoint: string, options: any = {}) => {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const fetchOptions = {
        ...options,
        headers,
        body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body
    };

    const vApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const cleanBaseUrl = vApiUrl.endsWith('/api') ? vApiUrl : `${vApiUrl.replace(/\/$/, '')}/api`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Avoid double /api/api
    const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${cleanBaseUrl}/${finalEndpoint}`;

    const response = await fetch(fullUrl, fetchOptions);
    const data = await response.json().catch(() => ({ message: 'Invalid server response' }));

    if (!response.ok) {
        if (response.status === 401) {
            // Handle token expiration - maybe redirect to login
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new Error(data.message || 'API request failed');
    }

    return data;
};
