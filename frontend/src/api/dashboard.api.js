import axiosInstance from './axiosInstance';

export const getDashboardStats = () => axiosInstance.get('/dashboard/stats');
export const getCandidateDashboardStats = () => axiosInstance.get('/dashboard/candidate');
