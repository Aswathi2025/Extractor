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

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Please enter your details to sign in to your account."
    >
      <form onSubmit={handleSubmit((data) => login(data))}>
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
        
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-bold text-dark text-uppercase tracking-wide mb-0">Password</label>
            <Link to="/forgot-password" className="text-primary text-decoration-none small fw-semibold hover-underline">Forgot password?</Link>
          </div>
          <div className="position-relative">
            <i className="bi bi-lock position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="password" 
              className={`form-control form-control-lg input-float ps-5 ${errors.password ? 'is-invalid border-danger' : ''}`} 
              style={{fontSize: '0.95rem'}} 
              placeholder="••••••••" 
              {...register('password')} 
            />
          </div>
          {errors.password && <div className="text-danger small mt-1 fw-medium"><i className="bi bi-exclamation-circle me-1"></i>{errors.password.message}</div>}
        </div>
        
        <button type="submit" className="btn btn-glow w-100 py-3 mb-4 fw-bold rounded-3 text-uppercase tracking-wide fs-6" disabled={isPending}>
          {isPending ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</> : 'Sign in to account'}
        </button>
      </form>
      
      <p className="text-center text-muted fw-medium mb-0">
        Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none ms-1 hover-underline">Register here</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
