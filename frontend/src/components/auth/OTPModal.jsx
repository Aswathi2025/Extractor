import { useState, useEffect } from 'react';
import { useVerifyOTP, useResendOTP } from '../../hooks/useAuth';

const OTPModal = ({ isOpen, userId, email, onClose }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOTP();
  const { mutate: resendOtp, isPending: isResending } = useResendOTP();

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(300);
    setOtp('');
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    verifyOtp({ user_id: userId, email, otp });
  };

  const handleResend = () => {
    resendOtp({ user_id: userId, email }, {
      onSuccess: () => {
        setTimeLeft(300);
        setOtp('');
      }
    });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="bg-primary p-4 text-white text-center position-relative">
            <div className="bg-white bg-opacity-20 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-shield-lock-fill fs-2"></i>
            </div>
            <h4 className="fw-bold mb-1">Enter Verification Code</h4>
            <p className="small mb-0 opacity-75">
              We sent a 6-digit OTP code to <strong className="text-warning">{email}</strong>
            </p>
          </div>

          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-4 text-center">
                <label className="form-label small fw-bold text-uppercase text-muted tracking-wide d-block mb-3">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="form-control form-control-lg text-center fw-bold fs-2 tracking-widest border-2 border-primary-subtle rounded-3 py-2"
                  style={{ letterSpacing: '0.5em' }}
                  autoFocus
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <span className="small text-muted">
                  <i className="bi bi-clock me-1 text-primary"></i>
                  Expires in: <strong className={timeLeft < 60 ? 'text-danger fw-bold' : 'text-dark fw-bold'}>{formatTime(timeLeft)}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="btn btn-link text-decoration-none p-0 small fw-bold text-primary"
                >
                  {isResending ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>Resending...</>
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || isVerifying}
                className="btn btn-primary w-100 py-3 fw-bold rounded-3 text-uppercase tracking-wide shadow-sm"
              >
                {isVerifying ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
