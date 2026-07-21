import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
});

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { mutate: doRegister, isPending } = useRegister();

  const onSubmit = ({ name, email, password }) => doRegister({ name, email, password });

  return (
    <AuthLayout 
      title="Create account" 
      subtitle="Join Extractor to streamline your hiring process."
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {[
          { name: 'name', label: 'Full Name', type: 'text', icon: 'bi-person' },
          { name: 'email', label: 'Email Address', type: 'email', icon: 'bi-envelope' },
          { name: 'password', label: 'Password', type: 'password', icon: 'bi-lock' },
          { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: 'bi-lock-fill' },
        ].map(({ name, label, type, icon }) => (
          <div className="mb-4" key={name}>
            <label className="form-label small fw-bold text-dark text-uppercase tracking-wide">{label}</label>
            <div className="position-relative">
              <i className={`bi ${icon} position-absolute top-50 translate-middle-y text-muted ms-3`}></i>
              <input 
                type={type} 
                className={`form-control form-control-lg input-float ps-5 ${errors[name] ? 'is-invalid border-danger' : ''}`} 
                style={{fontSize: '0.95rem'}} 
                {...register(name)} 
              />
            </div>
            {errors[name] && <div className="text-danger small mt-1 fw-medium"><i className="bi bi-exclamation-circle me-1"></i>{errors[name].message}</div>}
          </div>
        ))}
        
        <button type="submit" className="btn btn-glow w-100 py-3 mt-2 mb-4 fw-bold rounded-3 text-uppercase tracking-wide fs-6" disabled={isPending}>
          {isPending ? <><span className="spinner-border spinner-border-sm me-2"></span>Registering...</> : 'Create account'}
        </button>
      </form>
      
      <p className="text-center text-muted fw-medium mb-0">
        Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none ms-1 hover-underline">Sign In</Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
