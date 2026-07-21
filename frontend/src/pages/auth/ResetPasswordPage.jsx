import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSearchParams } from 'react-router-dom';
import { useResetPassword } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';

const schema = yup.object({
  newPassword: yup.string().min(6).required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm Password is required'),
});

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { mutate: reset, isPending } = useResetPassword();

  const onSubmit = ({ newPassword, confirmPassword }) => reset({ token, newPassword, confirmPassword });

  return (
    <AuthLayout 
      title="Choose a new password" 
      subtitle="Please enter your new password below."
    >
      {!token && (
        <div className="alert alert-danger border-danger bg-danger-subtle text-danger small fw-bold p-3 rounded-3 d-flex align-items-center mb-4">
          <i className="bi bi-x-circle-fill fs-5 me-2"></i>
          Invalid or missing reset link.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        {[
          { name: 'newPassword', label: 'New Password', icon: 'bi-lock' },
          { name: 'confirmPassword', label: 'Confirm Password', icon: 'bi-lock-fill' },
        ].map(({ name, label, icon }) => (
          <div className="mb-4" key={name}>
            <label className="form-label small fw-bold text-dark text-uppercase tracking-wide">{label}</label>
            <div className="position-relative">
              <i className={`bi ${icon} position-absolute top-50 translate-middle-y text-muted ms-3`}></i>
              <input 
                type="password" 
                className={`form-control form-control-lg input-float ps-5 ${errors[name] ? 'is-invalid border-danger' : ''}`} 
                style={{fontSize: '0.95rem'}} 
                {...register(name)} 
              />
            </div>
            {errors[name] && <div className="text-danger small mt-1 fw-medium"><i className="bi bi-exclamation-circle me-1"></i>{errors[name].message}</div>}
          </div>
        ))}
        <button type="submit" className="btn btn-glow w-100 py-3 mt-2 fw-bold rounded-3 text-uppercase tracking-wide fs-6" disabled={isPending || !token}>
          {isPending ? <><span className="spinner-border spinner-border-sm me-2"></span>Resetting...</> : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
