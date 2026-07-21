import { useMyApplications } from '../../hooks/useApplications';
import { Link } from 'react-router-dom';
import moment from 'moment';

const CandidateApplicationsPage = () => {
  const { data: response, isLoading, isError } = useMyApplications();

  const applications = response?.data || [];

  if (isError) {
    return (
      <div className="text-center py-5 bg-white rounded-4 shadow-soft border">
        <div className="text-danger fs-1 mb-3"><i className="bi bi-exclamation-circle"></i></div>
        <h5 className="fw-bold">Failed to load applications</h5>
        <p className="text-muted">Please try again later.</p>
        <button className="btn btn-outline-primary mt-3" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-medium small"><i className="bi bi-check-circle me-1"></i>Accepted</span>;
      case 'rejected':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill fw-medium small"><i className="bi bi-x-circle me-1"></i>Rejected</span>;
      case 'aptitude_round':
        return <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill fw-medium small"><i className="bi bi-file-earmark-text me-1"></i>Aptitude Round</span>;
      case 'technical_round':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 rounded-pill fw-medium small"><i className="bi bi-code-square me-1"></i>Technical Round</span>;
      case 'face_to_face_interview':
        return <span className="badge bg-purple-subtle border px-3 py-2 rounded-pill fw-medium small" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#e9d5ff' }}><i className="bi bi-person-video me-1"></i>Interview</span>;
      case 'reviewed':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-medium small"><i className="bi bi-eye me-1"></i>Reviewed</span>;
      case 'pending':
      default:
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill fw-medium small"><i className="bi bi-clock me-1"></i>Pending</span>;
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold tracking-tight text-dark mb-1">My Applications</h4>
          <p className="text-muted mb-0 small">Track the status of your job applications</p>
        </div>
        <Link to="/jobs" className="btn btn-primary rounded-pill fw-medium px-4 shadow-sm">
          Browse More Jobs
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 text-muted fw-medium">Loading applications...</div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-soft border mt-4">
          <div className="text-muted fs-1 mb-3"><i className="bi bi-file-earmark-x"></i></div>
          <h5 className="fw-bold text-dark">No applications yet</h5>
          <p className="text-muted small mb-4">You haven't applied for any jobs yet. Start exploring to find your dream role!</p>
          <Link to="/jobs" className="btn btn-primary rounded-pill px-4">Find Jobs</Link>
        </div>
      ) : (
        <div className="bg-white rounded-4 shadow-soft border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4 fw-semibold text-secondary small text-uppercase tracking-wider">Job Role</th>
                  <th className="py-3 px-4 fw-semibold text-secondary small text-uppercase tracking-wider">Applied Date</th>
                  <th className="py-3 px-4 fw-semibold text-secondary small text-uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 fw-semibold text-secondary small text-uppercase tracking-wider text-end">Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                          <i className="bi bi-briefcase fs-5"></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold text-dark">{app.job_role?.title || 'Unknown Job'}</h6>
                          <div className="text-muted small">{app.job_role?.min_experience}+ Years Experience</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-dark fw-medium">{moment(app.applied_at).format('MMM DD, YYYY')}</div>
                      <div className="text-muted small">{moment(app.applied_at).format('hh:mm A')}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <Link to={`/jobs/${app.job_role_id}`} className="btn btn-sm btn-light border rounded-pill px-3 fw-medium">
                        View Job
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateApplicationsPage;
