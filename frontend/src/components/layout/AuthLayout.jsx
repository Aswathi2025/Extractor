import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="d-flex min-vh-100 flex-column flex-md-row">
      {/* Left Panel: Visual/Branding */}
      <div className="col-12 col-md-6 auth-bg-img position-relative d-none d-md-flex align-items-end p-5">
        <div className="bg-glass p-5 rounded-4 shadow-lg w-100 mb-4" style={{ zIndex: 2 }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-lightning-charge-fill fs-4"></i>
            </div>
            <h2 className="mb-0 fw-bolder text-white tracking-tight" style={{ fontSize: '2.5rem' }}>Extractor.</h2>
          </div>
          <p className="text-white opacity-75 fs-5 mb-0 fw-light lh-base">
            Streamline your hiring process with our intelligent Applicant Tracking System.
            Identify top talent faster and smarter.
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="col-12 col-md-6 d-flex align-items-center justify-content-center bg-white p-4 p-sm-5">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          <div className="mb-5 text-center text-md-start">
            {/* Mobile Branding (hidden on desktop) */}
            <div className="d-flex d-md-none align-items-center justify-content-center gap-2 mb-4">
              <div className="bg-primary rounded text-white d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-lightning-charge-fill fs-5"></i>
              </div>
              <h3 className="mb-0 fw-bold tracking-tight text-dark">Extractor.</h3>
            </div>
            
            <h3 className="fw-bolder text-dark mb-2 tracking-tight">{title}</h3>
            {subtitle && <p className="text-muted">{subtitle}</p>}
          </div>

          {children}

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
