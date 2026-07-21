import axiosInstance from './axiosInstance';

export const getUsers = (params) => axiosInstance.get('/users', { params });
export const getUser = (id) => axiosInstance.get(`/users/${id}`);
export const updateUserStatus = (id, status) => axiosInstance.put(`/users/${id}/status`, { status });
export const getUserResume = (id) => axiosInstance.get(`/users/${id}/resume`);
export const getProfile = () => axiosInstance.get('/users/profile');
export const updateProfile = (data) => axiosInstance.put('/users/profile', data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});
