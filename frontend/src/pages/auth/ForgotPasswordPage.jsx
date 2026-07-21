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
      subtitle="Enter your email and we'll send a reset link."
    >
      {isSuccess ? (
        <div className="alert alert-success border-success bg-success-subtle text-success small fw-bold p-3 rounded-3 d-flex align-items-center">
          <i className="bi bi-check-circle-fill fs-5 me-2"></i>
          Check your inbox for the reset link!
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => forgot(d))}>
          <div className="mb-4">
            <label className="form-label small fw-bold text-dark text-uppercase tracking-wide">Email</label>
            <div className="position-relative">
              <i className="bi bi-envelope position-absolute top-50 translate-middle-y text-muted ms-3"></i>
              <input 
                type="email" 
                className={`form-control form-control-lg input-float ps-5 ${errors.email ? 'is-invalid border-danger' : ''}`} 
                style={{fontSize: '0.95rem'}} 
                placeholder="name@company.com" 
                {...register('email')} 
              />
            </div>
            {errors.email && <div className="text-danger small mt-1 fw-medium"><i className="bi bi-exclamation-circle me-1"></i>{errors.email.message}</div>}
          </div>
          <button type="submit" className="btn btn-glow w-100 py-3 mb-4 fw-bold rounded-3 text-uppercase tracking-wide fs-6" disabled={isPending}>
            {isPending ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</> : 'Send Reset Link'}
          </button>
        </form>
      )}
      <p className="text-center text-muted fw-medium mb-0">
        <Link to="/login" className="text-primary fw-bold text-decoration-none hover-underline"><i className="bi bi-arrow-left me-1"></i>Back to Login</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
