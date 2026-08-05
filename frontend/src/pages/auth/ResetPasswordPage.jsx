import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSearchParams } from 'react-router-dom';
import { useResetPassword } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';

const schema = yup.object({
  newPassword: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm Password is required'),
});

const fields = [
  { name: 'newPassword',     label: 'New Password',     icon: 'bi-lock',      delay: '0.2s' },
  { name: 'confirmPassword', label: 'Confirm Password', icon: 'bi-lock-fill', delay: '0.25s' },
];

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const { mutate: reset, isPending } = useResetPassword();

  const onSubmit = ({ newPassword, confirmPassword }) => reset({ token, newPassword, confirmPassword });

  return (
    <AuthLayout
      title="Choose New Password"
      subtitle="Please enter your new password below."
    >
      {!token && (
        <div className="auth-error-alert" style={{ animationDelay: '0.15s' }}>
          <i className="bi bi-x-circle-fill me-2" />
          Invalid or missing reset link.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {fields.map(({ name, label, icon, delay }) => (
          <div className="auth-field-group" key={name} style={{ animationDelay: delay }}>
            <label className="auth-label">{label}</label>
            <div className="auth-input-wrap">
              <i className={`bi ${icon} auth-input-icon`} />
              <input
                type="password"
                className={`auth-input${errors[name] ? ' auth-input-error' : ''}`}
                {...register(name)}
              />
            </div>
            {errors[name] && (
              <div className="auth-error-msg">
                <i className="bi bi-exclamation-circle me-1" />{errors[name].message}
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isPending || !token}
          style={{ animationDelay: '0.3s' }}
        >
          {isPending ? (
            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Resetting...</>
          ) : (
            <><i className="bi bi-shield-check me-2" />Reset Password</>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
