import axiosInstance from './axiosInstance';

export const getSkills = (params) => axiosInstance.get('/skills', { params });
export const createSkill = (data) => axiosInstance.post('/skills', data);
export const deleteSkill = (id) => axiosInstance.delete(`/skills/${id}`);
