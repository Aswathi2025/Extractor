import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as questionsApi from '../api/questions.api';
import toast from 'react-hot-toast';

export const useQuestions = (params) =>
  useQuery({
    queryKey: ['questions', params],
    queryFn: () => questionsApi.getQuestions(params).then((r) => r.data),
  });

export const useQuestionById = (id) =>
  useQuery({
    queryKey: ['questions', id],
    queryFn: () => questionsApi.getQuestionById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: questionsApi.createQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create question'),
  });
};

export const useUpdateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => questionsApi.updateQuestion(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update question'),
  });
};

export const useDeleteQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: questionsApi.deleteQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete question'),
  });
};

export const useGenerateQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: questionsApi.generateQuestion,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success(res.data?.message || 'Questions generated successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate questions'),
  });
};
