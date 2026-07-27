import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testsApi } from '../api/tests.api';
import toast from 'react-hot-toast';

export const useMyTests = () =>
  useQuery({
    queryKey: ['my-tests'],
    queryFn: () => testsApi.getMyTests().then(res => res.data),
  });

export const useTestById = (id) =>
  useQuery({
    queryKey: ['test', id],
    queryFn: () => testsApi.getTestById(id).then(res => res.data),
    enabled: !!id
  });

export const useAdminTestById = (id) =>
  useQuery({
    queryKey: ['admin-test', id],
    queryFn: () => testsApi.getAdminTestById(id).then(res => res.data),
    enabled: !!id
  });

export const useSubmitTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answers }) => testsApi.submitTestAnswers(id, answers),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ['my-tests'] });
      qc.invalidateQueries({ queryKey: ['test', variables.id] });
      toast.success('Test submitted successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit test');
    }
  });
};

export const useEvaluateTest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, score }) => testsApi.evaluateTest(id, score !== undefined ? { score } : {}),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['application'] });
      qc.invalidateQueries({ queryKey: ['admin-test', variables.id] });
      toast.success('Test score updated successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to evaluate test');
    }
  });
};
