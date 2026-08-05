import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';

const schema = yup.object({ email: yup.string().email('Invalid email').required('Email is required') });

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { mutate: forgot, isPending, isSuccess } = useForgotPassword();

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {isSuccess ? (
        <div className="auth-success-alert" style={{ animationDelay: '0.2s' }}>
          <i className="bi bi-check-circle-fill me-2" />
          Check your inbox for the reset link!
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => forgot(d))} noValidate>
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

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={isPending}
            style={{ animationDelay: '0.3s' }}
          >
            {isPending ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Sending...</>
            ) : (
              <><i className="bi bi-send me-2" />Send Reset Link</>
            )}
          </button>
        </form>
      )}

      <p className="auth-footer-text" style={{ animationDelay: '0.35s' }}>
        <Link to="/login" className="auth-footer-link">
          <i className="bi bi-arrow-left me-1" />Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
