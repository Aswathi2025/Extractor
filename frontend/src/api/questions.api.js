import axiosInstance from './axiosInstance';

export const getQuestions = (params) => axiosInstance.get('/questions', { params });
export const getQuestionById = (id) => axiosInstance.get(`/questions/${id}`);
export const createQuestion = (data) => axiosInstance.post('/questions', data);
export const updateQuestion = (id, data) => axiosInstance.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => axiosInstance.delete(`/questions/${id}`);
export const generateQuestion = (data) => axiosInstance.post('/questions/generate', data);
