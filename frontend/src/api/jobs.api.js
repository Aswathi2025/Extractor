import axiosInstance from './axiosInstance';

export const getJobs = (params) => axiosInstance.get('/jobs', { params });
export const getJobById = (id) => axiosInstance.get(`/jobs/${id}`);
export const createJob = (data) => axiosInstance.post('/jobs', data);
export const updateJob = (id, data) => axiosInstance.put(`/jobs/${id}`, data);
export const deleteJob = (id) => axiosInstance.delete(`/jobs/${id}`);
export const generateJobDescription = (data) => axiosInstance.post('/jobs/generate-description', data);
