import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVerifyEmail } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { mutate: verify, isPending, isError, isSuccess } = useVerifyEmail();

  useEffect(() => {
    if (token) verify({ token });
  }, [token, verify]);

  return (
    <AuthLayout 
      title="Email Verification" 
      subtitle={token ? "Please wait while we verify your email address..." : ""}
    >
      <div className="text-center py-4">
        {!token && (
          <div className="alert alert-danger border-danger bg-danger-subtle text-danger small fw-bold p-3 rounded-3 d-flex align-items-center mb-0">
            <i className="bi bi-x-circle-fill fs-5 me-2"></i>
            No verification token found in the URL.
          </div>
        )}
        {isPending && (
          <div className="d-flex flex-column align-items-center">
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status"></div>
            <h5 className="fw-bold text-dark">Verifying your email...</h5>
            <p className="text-muted small">This will only take a moment.</p>
          </div>
        )}
        {isSuccess && (
          <div className="alert alert-success border-success bg-success-subtle text-success small fw-bold p-4 rounded-4 d-flex flex-column align-items-center mb-0">
            <i className="bi bi-check-circle-fill display-4 mb-2"></i>
            <span className="fs-5">Email verified successfully!</span>
            <span className="mt-2 opacity-75 fw-normal">Redirecting you to login...</span>
          </div>
        )}
        {isError && (
          <div className="alert alert-danger border-danger bg-danger-subtle text-danger small fw-bold p-4 rounded-4 d-flex flex-column align-items-center mb-0">
            <i className="bi bi-x-circle-fill display-4 mb-2"></i>
            <span className="fs-5">Verification failed</span>
            <span className="mt-2 opacity-75 fw-normal">The link may be invalid or has expired.</span>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
