import { useMutation } from '@tanstack/react-query';
import * as authApi from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data: res }) => {
      // Backend returns: { success, accessToken, data: { name, role } }
      const user = res.data;
      const accessToken = res.accessToken;
      login(user, accessToken);
      toast.success('Welcome back!');
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    },
  });
};

export const useRegister = (options = {}) => {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      toast.success('Registration successful! Please enter the OTP sent to your email.');
      if (options.onSuccess) options.onSuccess(res);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    },
  });
};

export const useVerifyOTP = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: ({ data }) => {
      if (data.accessToken && data.data) {
        login(data.data, data.accessToken);
      }
      toast.success('Email verified successfully!');
      navigate('/login');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'OTP verification failed');
    },
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: authApi.resendOTP,
    onSuccess: () => {
      toast.success('New OTP sent to your email!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to resend OTP');
    },
  });
};

export const useVerifyEmail = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: ({ data }) => {
      if (data.accessToken) login(null, data.accessToken);
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Verification failed');
    },
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => toast.success('Reset OTP sent! Check your email.'),
    onError: (err) => toast.error(err.response?.data?.error || err.response?.data?.message || 'Request failed'),
  });

export const useResetPassword = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully!');
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.error || err.response?.data?.message || 'Reset failed'),
  });
};
