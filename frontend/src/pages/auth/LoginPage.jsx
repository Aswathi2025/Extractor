import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue to your account">

      <form onSubmit={handleSubmit((data) => login({ ...data, rememberMe }))} noValidate>

        {/* Email field */}
        <div className="auth-field-group" style={{ animationDelay: '0.2s' }}>
          <label className="auth-label">Email</label>
          <div className="auth-input-wrap">
            <i className="bi bi-envelope auth-input-icon" />
            <input
              type="email"
              className={`auth-input${errors.email ? ' auth-input-error' : ''}`}
              placeholder="name@company.com"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <div className="auth-error-msg">
              <i className="bi bi-exclamation-circle me-1" />{errors.email.message}
            </div>
          )}
        </div>

        {/* Password field */}
        <div className="auth-field-group" style={{ animationDelay: '0.3s' }}>
          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <i className="bi bi-lock auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className={`auth-input auth-input-padded-right${errors.password ? ' auth-input-error' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} />
            </button>
          </div>
          {errors.password && (
            <div className="auth-error-msg">
              <i className="bi bi-exclamation-circle me-1" />{errors.password.message}
            </div>
          )}
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="auth-remember-row" style={{ animationDelay: '0.35s' }}>
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <span className="auth-checkbox-custom" />
            <span className="auth-checkbox-text">Remember me</span>
          </label>
          <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isPending}
          style={{ animationDelay: '0.4s' }}
        >
          {isPending ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            <>
              <i className="bi bi-box-arrow-in-right me-2" />
              Sign In
            </>
          )}
        </button>

        {/* Divider */}
        <div className="auth-divider" style={{ animationDelay: '0.45s' }}>
          <span className="auth-divider-line" />
          <span className="auth-divider-text">OR</span>
          <span className="auth-divider-line" />
        </div>

        {/* Social sign-in */}
        <div className="auth-social-row" style={{ animationDelay: '0.5s' }}>
          <button type="button" className="auth-social-btn" aria-label="Sign in with Google">
            <svg className="auth-social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

      </form>

      {/* Footer link */}
      <p className="auth-footer-text" style={{ animationDelay: '0.55s' }}>
        Don't have an account?{' '}
        <Link to="/register" className="auth-footer-link">Sign Up</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
