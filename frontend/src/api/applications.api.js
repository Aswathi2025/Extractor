import axiosInstance from './axiosInstance';

export const getApplications = (params) => axiosInstance.get('/applications', { params });

export const getApplication = (id) => axiosInstance.get(`/applications/${id}`);

export const getMyApplications = () => axiosInstance.get('/applications/me');

export const getCurrentResume = () => axiosInstance.get('/applications/resume');

export const uploadResume = (formData) => {
  return axiosInstance.post('/applications/upload-resume', formData);
};

export const createApplication = (data) => {
  return axiosInstance.post('/applications/apply', data);
};

export const updateApplicationStatus = (id, payload) => {
  return axiosInstance.put(`/applications/${id}/status`, payload);
};

export const deleteApplication = (id) => {
  return axiosInstance.delete(`/applications/${id}`);
};

export const resendApplicationEmail = (id) => {
  return axiosInstance.post(`/applications/${id}/resend-email/`);
};
