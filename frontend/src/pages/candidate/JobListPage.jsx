import { useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import { useMyApplications } from '../../hooks/useApplications';
import { Link } from 'react-router-dom';
import moment from 'moment';

const JobListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: response, isLoading, isError } = useJobs({ page, limit: 12, search });
  const { data: myAppsData } = useMyApplications();

  const jobs = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1 };
  
  const myApplications = myAppsData?.data || [];
  const appliedJobIds = new Set(myApplications.map(app => app.job_role_id));

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (isError) {
    return (
      <div className="text-center py-5 bg-white rounded-4 shadow-soft border">
        <div className="text-danger fs-1 mb-3"><i className="bi bi-exclamation-circle"></i></div>
        <h5 className="fw-bold">Failed to load jobs</h5>
        <p className="text-muted">Please try again later.</p>
        <button className="btn btn-outline-primary mt-3" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold tracking-tight text-dark mb-1">Available Jobs</h4>
          <p className="text-muted mb-0 small">Find your next big opportunity.</p>
        </div>
        
        <div style={{ maxWidth: '300px', width: '100%' }}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="text" 
              className="form-control input-stylish ps-5 shadow-sm border-0 bg-white" 
              placeholder="Search jobs..." 
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 text-muted fw-medium">Discovering roles...</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-soft border mt-4">
          <div className="text-muted fs-1 mb-3"><i className="bi bi-search"></i></div>
          <h5 className="fw-bold text-dark">No jobs found</h5>
          <p className="text-muted small">We couldn't find any jobs matching your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {jobs.map((job) => {
              const isApplied = appliedJobIds.has(job.id);
              
              return (
                <div key={job.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-soft rounded-4 overflow-hidden position-relative transition-hover">
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                        {isApplied ? (
                          <div className="bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold small d-flex align-items-center text-nowrap">
                            <i className="bi bi-check2-circle me-1"></i> Already Applied
                          </div>
                        ) : (
                          <div className="bg-primary-subtle text-primary rounded px-3 py-1 fw-semibold small text-nowrap">
                            {job.min_experience}+ Years Exp
                          </div>
                        )}
                        <div className="text-muted small d-flex align-items-center text-nowrap" title="Last Application Date">
                          <i className="bi bi-clock me-1"></i>
                          {job.last_application_date ? moment(job.last_application_date).format('MMM DD, YYYY') : 'Ongoing'}
                        </div>
                      </div>
                      
                      <h5 className="card-title fw-bold text-dark mb-3 text-truncate">{job.title}</h5>

                      <div className="mb-4 flex-grow-1">
                        {job.required_skills?.slice(0, 3).map(skill => (
                          <span key={skill.id} className="badge bg-light text-secondary border me-1 mb-1">
                            {skill.name}
                          </span>
                        ))}
                        {job.required_skills?.length > 3 && (
                          <span className="badge bg-light text-secondary border me-1 mb-1">
                            +{job.required_skills.length - 3} more
                          </span>
                        )}
                        {!job.required_skills?.length && (
                          <span className="text-muted small fst-italic">No specific skills listed</span>
                        )}
                      </div>

                      <Link 
                        to={`/jobs/${job.id}`} 
                        className={`btn w-100 rounded-pill fw-medium mt-auto ${isApplied ? 'btn-light border text-success' : 'btn-outline-primary'}`}
                      >
                        {isApplied ? 'View Status' : 'View Details'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4 bg-white p-3 rounded-4 shadow-soft border">
              <div className="small text-muted fw-medium">Showing page {meta.page} of {meta.totalPages}</div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-light border fw-medium rounded-pill px-3" 
                  disabled={meta.page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-sm btn-light border fw-medium rounded-pill px-3" 
                  disabled={meta.page >= meta.totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
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

export default JobListPage;
