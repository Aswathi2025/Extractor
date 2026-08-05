import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';
import OTPModal from '../../components/auth/OTPModal';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
});

const fields = [
  { name: 'name',            label: 'Full Name',        type: 'text',     icon: 'bi-person',    delay: '0.2s' },
  { name: 'email',           label: 'Email Address',    type: 'email',    icon: 'bi-envelope',  delay: '0.25s' },
  { name: 'password',        label: 'Password',         type: 'password', icon: 'bi-lock',      delay: '0.3s' },
  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: 'bi-lock-fill', delay: '0.35s' },
];

const RegisterPage = () => {
  const [registeredUser, setRegisteredUser] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const { mutate: doRegister, isPending } = useRegister({
    onSuccess: (res) => {
      const responseData = res?.data || res;
      const userData = responseData?.data || responseData;
      if (userData) {
        setRegisteredUser(userData);
        setShowOtpModal(true);
      }
    }
  });

  const onSubmit = ({ name, email, password }) => doRegister({ name, email, password });

  return (
    <>
      <AuthLayout
        title="Create Account"
        subtitle="Join Extractor to streamline your hiring process."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {fields.map(({ name, label, type, icon, delay }) => (
            <div className="auth-field-group" key={name} style={{ animationDelay: delay }}>
              <label className="auth-label">{label}</label>
              <div className="auth-input-wrap">
                <i className={`bi ${icon} auth-input-icon`} />
                <input
                  type={type}
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
            disabled={isPending}
            style={{ animationDelay: '0.4s' }}
          >
            {isPending ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Registering...</>
            ) : (
              <><i className="bi bi-person-plus me-2" />Create Account</>
            )}
          </button>
        </form>

        <p className="auth-footer-text" style={{ animationDelay: '0.45s' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-footer-link">Sign In</Link>
        </p>
      </AuthLayout>

      <OTPModal
        isOpen={showOtpModal}
        userId={registeredUser?.id}
        email={registeredUser?.email}
        onClose={() => setShowOtpModal(false)}
      />
    </>
  );
};

export default RegisterPage;
