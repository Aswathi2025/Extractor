import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../api/users.api';
import toast from 'react-hot-toast';

export const useUsers = (params) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers(params).then((r) => r.data),
  });

export const useUser = (id) =>
  useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id).then((r) => r.data),
    enabled: !!id,
  });

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => usersApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    },
  });
};

export const useUserResume = (id) =>
  useQuery({
    queryKey: ['userResume', id],
    queryFn: () => usersApi.getUserResume(id).then((r) => r.data),
    enabled: false,
    retry: false
  });
