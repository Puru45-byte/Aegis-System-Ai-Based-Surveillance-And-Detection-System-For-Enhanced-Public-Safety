import axiosClient from './axiosClient';

export const scanPhoto = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threshold', 0.6); // default stricter match threshold

    const response = await axiosClient.post('/scan/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
