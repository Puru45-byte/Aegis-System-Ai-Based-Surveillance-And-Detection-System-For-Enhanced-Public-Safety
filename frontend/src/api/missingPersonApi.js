import axiosClient from './axiosClient';

export const submitMissingPersonReport = async (formData) => {
    console.log('DEBUG: Form data being sent:', formData);
    
    // Create FormData for multipart/form-data request
    const multipartFormData = new FormData();
    
    // Add each field individually as the backend expects
    Object.keys(formData).forEach(key => {
        if (key !== 'photo_file' && formData[key] !== null && formData[key] !== '') {
            multipartFormData.append(key, formData[key]);
        }
    });
    
    // Add photo file if exists
    if (formData.photo_file) {
        multipartFormData.append('photo', formData.photo_file);
        console.log('DEBUG: Photo file being sent:', formData.photo_file.name);
    }
    
    console.log('DEBUG: FormData being sent:', multipartFormData);
    
    try {
        const response = await axiosClient.post('/missing-persons/', multipartFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('DEBUG: API response:', response);
        return response;
    } catch (error) {
        console.error('DEBUG: API error:', error);
        console.error('DEBUG: API error response:', error.response?.data);
        throw error;
    }
};

export const getMissingPersonReports = () => axiosClient.get('/missing-persons/');
