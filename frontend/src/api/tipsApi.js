import axiosClient from './axiosClient';

export const submitTip = (data) => {
    return axiosClient.post('/tips/', data)
        .then(response => {
            return response;
        })
        .catch(error => {
            throw error;
        });
};
export const getTips = () => axiosClient.get('/tips/');
export const markTipReviewed = (id) => axiosClient.patch(`/tips/${id}/review`);
export const deleteTip = (id) => axiosClient.delete(`/tips/${id}`);
