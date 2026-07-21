import React from 'react';
import { useCandidateDashboardStats } from '../../hooks/useDashboard';
import { Link } from 'react-router-dom';
import moment from 'moment';

const CandidateDashboardPage = () => {
  const { data: stats, isLoading, isError } = useCandidateDashboardStats();

  const metrics = [
    {
      title: 'Total Applications',
      value: stats?.totalApplications || 0,
      icon: 'bi-file-earmark-text',
      colorClass: 'text-primary',
      bgClass: 'bg-primary-subtle',
    },
    {
      title: 'Pending / In Review',
      value: stats?.pendingApplications || 0,
      icon: 'bi-hourglass-split',
      colorClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
    {
      title: 'Tests Completed',
      value: stats?.completedTests || 0,
      icon: 'bi-journal-check',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle',
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">Pending</span>;
      case 'reviewed': return <span className="badge bg-info text-dark px-3 py-2 rounded-pill shadow-sm">Reviewed</span>;
      case 'aptitude_round': return <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">Aptitude Round</span>;
      case 'technical_round': return <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">Technical Round</span>;
      case 'face_to_face_interview': return <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">Interview</span>;
      case 'accepted': return <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm">Accepted</span>;
      case 'rejected': return <span className="badge bg-danger px-3 py-2 rounded-pill shadow-sm">Rejected</span>;
      default: return <span className="badge bg-secondary px-3 py-2 rounded-pill shadow-sm">{status}</span>;
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-1">Welcome Back!</h4>
        <p className="text-muted small">Here is an overview of your job hunting journey.</p>
      </div>

      {isLoading ? (
        <div className="row g-4">
          {[...Array(3)].map((_, i) => (
            <div className="col-md-6 col-lg-4" key={i}>
              <div className="card border-0 rounded-4 shadow-soft placeholder-glow">
                <div className="card-body p-4 d-flex align-items-center">
                  <div className="placeholder col-3 rounded-circle me-3" style={{ height: '56px', width: '56px' }}></div>
                  <div className="w-100">
                    <span className="placeholder col-8 mb-2"></span>
                    <span className="placeholder col-5 placeholder-lg d-block"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="alert alert-danger shadow-soft border-0 rounded-4 text-center py-4">
          <i className="bi bi-exclamation-triangle fs-4 d-block mb-2"></i>
          Failed to load dashboard statistics.
        </div>
      ) : (
        <>
          <div className="row g-4 mb-5">
            {metrics.map((metric, idx) => (
              <div className="col-md-6 col-lg-4" key={idx}>
                <div className="card border-0 rounded-4 shadow-soft h-100 transition-hover">
                  <div className="card-body p-4 d-flex align-items-center">
                    <div 
                      className={`${metric.bgClass} ${metric.colorClass} rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
                      style={{ width: '56px', height: '56px' }}
                    >
                      <i className={`bi ${metric.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h6 className="text-muted fw-semibold mb-1 text-uppercase small tracking-wide" style={{ letterSpacing: '0.5px' }}>
                        {metric.title}
                      </h6>
                      <h3 className="fw-bold text-dark mb-0 tracking-tight">
                        {metric.value.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card border-0 rounded-4 shadow-soft h-100 mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-dark mb-0">Recent Applications</h6>
                <Link to="/applications" className="btn btn-sm btn-light border fw-medium rounded-pill px-3">
                  View All
                </Link>
              </div>

              {stats?.recentApplications?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 rounded-start">Job Role</th>
                        <th className="border-0">Experience Req.</th>
                        <th className="border-0">Applied On</th>
                        <th className="border-0 rounded-end">Status</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {stats.recentApplications.map((app) => (
                        <tr key={app.id}>
                          <td className="fw-medium">{app.job_role?.title || 'Unknown Role'}</td>
                          <td>{app.job_role?.min_experience ? `${app.job_role.min_experience}+ Years` : 'Not specified'}</td>
                          <td className="text-muted">{moment(app.applied_at).format('MMM DD, YYYY')}</td>
                          <td>{getStatusBadge(app.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="text-muted fs-1 mb-3"><i className="bi bi-folder-x"></i></div>
                  <h6 className="fw-bold text-dark">No Recent Applications</h6>
                  <p className="text-muted small">You haven't applied to any jobs yet. Start exploring available roles!</p>
                  <Link to="/jobs" className="btn btn-primary rounded-pill mt-2 px-4 shadow-sm">
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .transition-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .transition-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default CandidateDashboardPage;
