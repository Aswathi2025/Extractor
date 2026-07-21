import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as jobsApi from '../api/jobs.api';
import toast from 'react-hot-toast';

export const useJobs = (params) =>
  useQuery({
    queryKey: ['jobs', params],
    queryFn: () => jobsApi.getJobs(params).then((r) => r.data),
  });

export const useJobById = (id) =>
  useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.getJobById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.createJob,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create job'),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => jobsApi.updateJob(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update job'),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.deleteJob,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete job'),
  });
};

export const useGenerateJobDescription = () => {
  return useMutation({
    mutationFn: jobsApi.generateJobDescription,
    onSuccess: () => {
      toast.success('Job description generated successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate description'),
  });
};
