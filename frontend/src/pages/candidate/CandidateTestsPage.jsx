import React from 'react';
import { Link } from 'react-router-dom';
import { useMyTests } from '../../hooks/useTests';
import moment from 'moment';

const CandidateTestsPage = () => {
  const { data: responseData, isLoading, isError } = useMyTests();
  const tests = responseData?.data || [];

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-1">My Assessments</h4>
        <p className="text-muted mb-0 small">Complete the tests assigned to you for your job applications.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="mt-2 text-muted small">Loading assessments...</div>
        </div>
      ) : isError ? (
        <div className="text-center py-5 text-danger">
          <i className="bi bi-exclamation-circle fs-1 mb-2"></i>
          <h6>Failed to load assessments</h6>
        </div>
      ) : tests?.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 border shadow-sm">
          <i className="bi bi-journal-x fs-1 mb-2"></i>
          <h6>No assessments assigned yet.</h6>
          <p className="small">When your application advances, your tests will appear here.</p>
        </div>
      ) : (
        <div className="row g-4">
          {tests.map(test => (
            <div className="col-md-6 col-lg-4" key={test.id}>
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="bg-primary-subtle text-primary rounded p-2">
                      <i className="bi bi-journal-check fs-5"></i>
                    </div>
                    {test.is_completed ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Completed</span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Pending</span>
                    )}
                  </div>
                  <div className="small fw-bold text-uppercase tracking-wider mb-1" style={{ color: test.test_type === 'TECHNICAL' ? '#6f42c1' : '#0d6efd' }}>
                    {test.test_type === 'TECHNICAL' ? 'Technical Round' : 'Aptitude Round'}
                  </div>
                  <h5 className="fw-bold text-dark mb-1">
                    {test.application?.job_role?.title || 'Assessment Test'}
                  </h5>
                  <p className="small text-muted mb-4">Assigned {moment(test.assigned_at).fromNow()}</p>
                  
                  <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                    {test.is_completed ? (
                      <>
                        {test.test_type === 'TECHNICAL' ? (
                          <div className="fw-bold text-success small w-100 text-center py-1">
                            <i className="bi bi-check-circle me-1"></i>Submitted for Review
                          </div>
                        ) : (
                          <>
                            <div className="fw-bold text-dark">
                              Score: <span className={test.score >= 70 ? 'text-success' : 'text-danger'}>{test.score}%</span>
                            </div>
                            <Link to={`/tests/${test.id}`} className="btn btn-sm btn-outline-secondary rounded-pill fw-medium">View Result</Link>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="small text-muted">{test.total_questions} Questions</div>
                        <Link to={`/tests/${test.id}`} className="btn btn-sm btn-primary rounded-pill fw-medium px-4">Start Test</Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateTestsPage;
