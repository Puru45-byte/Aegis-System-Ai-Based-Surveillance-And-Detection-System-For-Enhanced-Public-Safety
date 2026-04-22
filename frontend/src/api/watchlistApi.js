import axiosClient from './axiosClient';

export const getCases = () => axiosClient.get('/cases/');
export const createCase = (data) => axiosClient.post('/cases/', data);
export const updateCase = (id, data) => axiosClient.put(`/cases/${id}`, data);
export const deleteCase = (id) => axiosClient.delete(`/cases/${id}`);
export const uploadCasePhoto = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/cases/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const getCasePhotoUrl = (id) => `/api/v1/cases/${id}/photo`;

export const getSurveillanceLogs = () => axiosClient.get('/surveillance/');

export const getTips = () => axiosClient.get('/tips/');
export const submitTip = (data) => axiosClient.post('/tips/', data);
export const markTipReviewed = (id) => axiosClient.patch(`/tips/${id}/review`);
