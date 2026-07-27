import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationsApi from '../api/applications.api';
import toast from 'react-hot-toast';

export const useApplications = (params) =>
  useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationsApi.getApplications(params).then((r) => r.data),
  });

export const useApplication = (id) =>
  useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getApplication(id).then((r) => r.data),
    enabled: !!id,
  });

export const useMyApplications = () =>
  useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationsApi.getMyApplications().then((r) => r.data),
  });

export const useCurrentResume = () =>
  useQuery({
    queryKey: ['current-resume'],
    queryFn: () => applicationsApi.getCurrentResume().then((r) => r.data),
  });

export const useUploadResume = () => {
  return useMutation({
    mutationFn: applicationsApi.uploadResume,
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    },
  });
};

export const useApplyForJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applicationsApi.createApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Application submitted successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, interview_date, interview_time, silent }) => 
      applicationsApi.updateApplicationStatus(id, { status, interview_date, interview_time }),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['application', variables.id] });
      if (!variables.silent) {
        toast.success('Application status updated successfully');
      }
    },
    onError: (err, variables) => {
      if (!variables.silent) {
        toast.error(err.response?.data?.message || 'Failed to update application status');
      }
    }
  });
};

export const useDeleteApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applicationsApi.deleteApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Application deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete application');
    }
  });
};
