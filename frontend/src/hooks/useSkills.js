import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as skillsApi from '../api/skills.api';
import toast from 'react-hot-toast';

export const useSkills = (params) =>
  useQuery({
    queryKey: ['skills', params],
    queryFn: () => skillsApi.getSkills(params).then((r) => r.data),
  });

export const useCreateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: skillsApi.createSkill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill added!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add skill'),
  });
};

export const useDeleteSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: skillsApi.deleteSkill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill deleted!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete skill'),
  });
};
