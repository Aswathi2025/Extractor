import axiosInstance from './axiosInstance';

export const testsApi = {
  getMyTests: () => axiosInstance.get('/tests/me'),
  getTestById: (id) => axiosInstance.get(`/tests/${id}`),
  getAdminTestById: (id) => axiosInstance.get(`/tests/admin/${id}`),
  submitTestAnswers: (id, answers) => axiosInstance.put(`/tests/${id}/submit`, { answers }),
  evaluateTest: (id) => axiosInstance.post(`/tests/${id}/evaluate`)
};
