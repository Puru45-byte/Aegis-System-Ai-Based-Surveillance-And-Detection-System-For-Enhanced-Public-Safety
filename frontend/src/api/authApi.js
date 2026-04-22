import axiosClient from './axiosClient';

export const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects 'username'
    formData.append('password', password);

    const response = await axiosClient.post('/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const register = async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
};

export const getMe = async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
};
