import { useState, useEffect } from 'react';
import { useApplications, useUpdateApplicationStatus, useApplication } from '../../hooks/useApplications';
import { useUserResume } from '../../hooks/useUsers';
import { useAdminTestById, useEvaluateTest } from '../../hooks/useTests';
import Modal from '../../components/ui/Modal';
import moment from 'moment';

const ApplicationsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data: response, isLoading, isError } = useApplications({ page, limit: 10, search, sortBy: 'updated_at', sortOrder: 'DESC' });
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateApplicationStatus();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [resumeTab, setResumeTab] = useState('parsed');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');

  const { data: fetchedAppDetails, isFetching: isFetchingAppDetails } = useApplication(selectedApplication?.id);
  const { data: resumeData, refetch: fetchResume, isFetching: isFetchingResume } = useUserResume(selectedApplication?.candidate?.id);

  const [viewTestId, setViewTestId] = useState(null);
  const { data: testAnswersData, isFetching: isFetchingTest } = useAdminTestById(viewTestId);
  const { mutate: evaluateTest, isPending: isEvaluatingTest } = useEvaluateTest();

  const activeApp = fetchedAppDetails ? { ...fetchedAppDetails, status: selectedApplication?.status } : selectedApplication;

  const applications = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1, totalItems: 0 };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openDetailsModal = (app) => {
    setSelectedApplication(app);
    setConfirmAction(null);
    setInterviewDate('');
    setInterviewTime('');
    setIsModalOpen(true);
    
    // Auto-update to reviewed if pending
    if (app.status === 'pending') {
      updateStatus(
        { id: app.id, status: 'reviewed', silent: true },
        {
          onSuccess: () => {
            setSelectedApplication(prev => ({ ...prev, status: 'reviewed' }));
          }
        }
      );
    }
  };

  useEffect(() => {
    if (isModalOpen && selectedApplication && !confirmAction) {
      fetchResume();
    }
  }, [isModalOpen, selectedApplication, confirmAction, fetchResume]);

  const handleStatusUpdateClick = (status) => {
    setConfirmAction(status);
    if (status === 'face_to_face_interview') {
      // Pre-fill tomorrow's date and default time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setInterviewDate(tomorrow.toISOString().split('T')[0]);
      setInterviewTime('10:00');
    }
  };

  const executeStatusUpdate = () => {
    if (!selectedApplication || !confirmAction) return;
    
    if (confirmAction === 'face_to_face_interview') {
      if (!interviewDate || !interviewTime) {
        return; // Alternatively show an error toast here
      }
    }
    
    updateStatus(
      { 
        id: selectedApplication.id, 
        status: confirmAction,
        ...(confirmAction === 'face_to_face_interview' && {
          interview_date: interviewDate,
          interview_time: interviewTime
        })
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setSelectedApplication(null);
          setConfirmAction(null);
        }
      }
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded">Accepted</span>;
      case 'face_to_face_interview':
        return <span className="badge bg-purple-subtle text-purple border border-purple-subtle px-2 py-1 rounded" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#e9d5ff' }}>Face to Face</span>;
      case 'aptitude_round':
        return <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 rounded">Aptitude Round</span>;
      case 'technical_round':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 rounded">Technical Round</span>;
      case 'reviewed':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded">Reviewed</span>;
      case 'rejected':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded">Rejected</span>;
      case 'pending':
      default:
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded">Pending</span>;
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold tracking-tight text-dark mb-1">Applications Management</h4>
          <p className="text-muted mb-0 small">Review and process candidate applications.</p>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
        <div className="p-4 border-bottom bg-light d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="fw-semibold text-dark">Total Applications: {meta.totalItems}</div>
          <div className="position-relative" style={{ maxWidth: '300px', width: '100%' }}>
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="text" 
              className="form-control ps-5 rounded-pill shadow-none border" 
              placeholder="Search candidate..." 
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-2 text-muted small">Loading applications...</div>
          </div>
        ) : isError ? (
          <div className="text-center py-5 text-danger">
            <i className="bi bi-exclamation-circle fs-1 mb-2"></i>
            <h6>Failed to load applications</h6>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 mb-2"></i>
            <h6>No applications found</h6>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold">Candidate</th>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold">Job Role</th>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold">Match</th>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold">Applied Date</th>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold">Last Updated</th>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold">Status</th>
                  <th className="py-3 px-4 text-secondary small text-uppercase fw-semibold text-end">Action</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: '40px', height: '40px'}}>
                          {app.candidate?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{app.candidate?.username}</div>
                          <div className="text-muted small">{app.candidate?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-dark fw-medium">{app.job_role?.title}</td>
                    <td className="py-3 px-4">
                      {app.match_score !== null ? (
                        <span className={`badge ${app.match_score >= 80 ? 'bg-success' : app.match_score >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                          {app.match_score}%
                        </span>
                      ) : (
                        <span className="text-muted small">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted small">{moment(app.applied_at).format('MMM DD, YYYY')}</td>
                    <td className="py-3 px-4 text-muted small">{moment(app.updated_at).format('MMM DD, YYYY')}</td>
                    <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                    <td className="py-3 px-4 text-end">
                      <button 
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium"
                        onClick={() => openDetailsModal(app)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
            <span className="small text-muted fw-medium">Page {meta.page} of {meta.totalPages}</span>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-white border rounded px-3" 
                disabled={meta.page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button 
                className="btn btn-sm btn-white border rounded px-3" 
                disabled={meta.page >= meta.totalPages} 
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setConfirmAction(null); }} title={confirmAction ? "Confirm Action" : "Application Details"} size="xl" dialogStyle={{ maxWidth: '95vw' }}>
        {confirmAction ? (
          <div className="text-center py-5">
            <i className={`bi ${confirmAction === 'rejected' ? 'bi-exclamation-triangle text-danger' : 'bi-check-circle text-success'} display-1 mb-3 d-block`}></i>
            <h4 className="fw-bold mb-3 text-dark">
              Are you sure you want to {confirmAction === 'rejected' ? 'reject this candidate' : confirmAction === 'aptitude_round' ? 'proceed this candidate to the aptitude round' : confirmAction === 'technical_round' ? 'proceed this candidate to the technical round' : 'proceed this candidate to face to face interview'}?
            </h4>
            <p className="text-muted mb-4">
              {confirmAction === 'rejected' 
                ? 'This will immediately notify the candidate that they have not been selected.' 
                : confirmAction === 'aptitude_round'
                ? 'This will automatically generate a 10-question assessment test and email the candidate.'
                : confirmAction === 'technical_round'
                ? 'This will automatically generate a 2-question programming test and email the candidate.'
                : 'This will notify the candidate for a face to face interview.'}
            </p>
            {confirmAction === 'face_to_face_interview' && (
              <div className="bg-light p-4 rounded-4 text-start mb-4 border d-inline-block" style={{ maxWidth: '400px' }}>
                <h6 className="fw-bold text-dark mb-3">Schedule Interview</h6>
                <div className="mb-3">
                  <label className="form-label small fw-medium">Interview Date <span className="text-danger">*</span></label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm border shadow-none" 
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="form-label small fw-medium">Interview Time <span className="text-danger">*</span></label>
                  <input 
                    type="time" 
                    className="form-control form-control-sm border shadow-none" 
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="d-flex justify-content-center gap-3 mt-4">
              <button className="btn btn-light border px-4 py-2 rounded-pill fw-medium" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button 
                className={`btn ${confirmAction === 'rejected' ? 'btn-danger' : 'btn-success'} px-5 py-2 rounded-pill fw-bold shadow-sm`}
                onClick={executeStatusUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...</>
                ) : (
                  'Yes, Confirm'
                )}
              </button>
            </div>
          </div>
        ) : activeApp && (
          <div className="p-2 transition-all" style={{ filter: viewTestId ? 'blur(4px)' : 'none', opacity: viewTestId ? 0.5 : 1, transition: 'all 0.3s ease', pointerEvents: viewTestId ? 'none' : 'auto' }}>
            <div className="row g-4">
              {/* Left Column: Details & Scores */}
              <div className="col-lg-5 d-flex flex-column gap-4">
                
                {/* Candidate Info Card */}
                <div className="bg-light p-4 rounded-4 border">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 shadow-sm" style={{width: '60px', height: '60px'}}>
                      {activeApp.candidate?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{activeApp.candidate?.username}</h4>
                      <div className="text-muted small">
                        <i className="bi bi-envelope me-1"></i>{activeApp.candidate?.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">
                      <i className="bi bi-briefcase me-2"></i>Applied for: {activeApp.job_role?.title}
                    </span>
                  </div>

                  <div className="pt-3 border-top bg-white p-3 rounded-3 shadow-sm border border-light">
                    <div className="text-muted small mb-2 fw-medium text-uppercase tracking-wider">Application Status</div>
                    <div className="d-flex justify-content-between align-items-center">
                      {getStatusBadge(activeApp.status)}
                      <div className="text-muted small">
                        <i className="bi bi-calendar3 me-1"></i>{moment(activeApp.applied_at).format('MMM DD, YYYY')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Score Section */}
                {activeApp.match_score !== null && (
                  <div className="bg-white border rounded-4 p-4 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: '48px', height: '48px'}}>
                          <i className="bi bi-bullseye fs-4"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0 fs-5">AI Match Score</h6>
                          <p className="text-muted small mb-0">Based on required skills</p>
                        </div>
                      </div>
                      <div className={`fw-bold display-6 ${activeApp.match_score >= 80 ? 'text-success' : activeApp.match_score >= 50 ? 'text-warning' : 'text-danger'}`}>
                        {activeApp.match_score}%
                      </div>
                    </div>
                    
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <h6 className="small fw-bold text-success mb-2"><i className="bi bi-check-circle-fill me-2"></i>Matched Skills</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {activeApp.matched_skills?.length > 0 ? (
                            activeApp.matched_skills.map((skill, i) => (
                              <span key={i} className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">{skill}</span>
                            ))
                          ) : (
                            <span className="text-muted small fst-italic">No matched skills</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h6 className="small fw-bold text-danger mb-2"><i className="bi bi-x-circle-fill me-2"></i>Missing Skills</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {activeApp.missing_skills?.length > 0 ? (
                            activeApp.missing_skills.map((skill, i) => (
                              <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">{skill}</span>
                            ))
                          ) : (
                            <span className="text-muted small fst-italic">No missing skills</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Score Section */}
                {activeApp.tests?.length > 0 && (
                  <div className="d-flex flex-column gap-3">
                    {activeApp.tests.map(test => test.is_completed && (
                      <div key={test.id} className="bg-white border border-secondary-subtle rounded-4 p-3 d-flex align-items-center justify-content-between shadow-sm transition-all hover-shadow">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm text-white ${test.test_type === 'APTITUDE' ? 'bg-info' : 'bg-secondary'}`} style={{width: '48px', height: '48px'}}>
                            <i className={test.test_type === 'APTITUDE' ? "bi bi-file-earmark-bar-graph fs-4" : "bi bi-code-square fs-4"}></i>
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-1">{test.test_type === 'APTITUDE' ? 'Aptitude Test' : 'Technical Test'}</h6>
                            <span className="badge bg-success-subtle text-success small border border-success-subtle"><i className="bi bi-check2-all me-1"></i>Completed</span>
                          </div>
                        </div>
                        <div className="text-end">
                          {test.test_type === 'TECHNICAL' && test.score === null ? (
                            <>
                              <div className="fw-bold fs-5 mb-2 text-primary">
                                <i className="bi bi-exclamation-circle me-1"></i>Needs Review
                              </div>
                              <button 
                                className="btn btn-sm btn-primary rounded-pill px-3 fw-medium shadow-sm"
                                onClick={() => setViewTestId(test.id)}
                              >
                                Review Answers
                              </button>
                            </>
                          ) : (
                            <>
                              <div className={`fw-bold fs-3 mb-1 ${test.score >= 70 ? 'text-success' : 'text-warning'}`}>
                                {Number(test.score || 0).toFixed(0)}%
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-medium shadow-sm"
                                onClick={() => setViewTestId(test.id)}
                              >
                                View Answers
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Resume & Actions */}
              <div className="col-lg-7 d-flex flex-column gap-4">
                <div className="bg-white border rounded-4 shadow-sm p-4 d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <div className="bg-primary-subtle text-primary rounded p-2 d-flex align-items-center justify-content-center">
                        <i className="bi bi-file-person"></i>
                      </div>
                      Candidate Resume
                    </h5>
                    <ul className="nav nav-pills nav-sm bg-light rounded-pill p-1 border shadow-sm">
                      <li className="nav-item">
                        <button 
                          className={`nav-link py-1 px-4 rounded-pill fw-medium transition-all ${resumeTab === 'parsed' ? 'active shadow-sm' : 'text-muted hover-bg-gray'}`}
                          onClick={() => setResumeTab('parsed')}
                        >Parsed Data</button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link py-1 px-4 rounded-pill fw-medium transition-all ${resumeTab === 'original' ? 'active shadow-sm' : 'text-muted hover-bg-gray'}`}
                          onClick={() => setResumeTab('original')}
                        >Original PDF</button>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex-grow-1">
                    {isFetchingResume ? (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-muted">
                        <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}></div>
                        <div className="fw-medium">Analyzing resume document...</div>
                      </div>
                    ) : resumeData ? (
                      <>
                        {resumeTab === 'parsed' && (
                          <div className="pe-2" style={{ height: '550px', overflowY: 'auto' }}>
                            {resumeData.analysis ? (
                              <div>
                                <div className="row mb-3">
                                  <div className="col-md-6">
                                    <span className="text-muted small d-block">Name</span>
                                    <span className="fw-medium">{resumeData.analysis.extracted_name || 'N/A'}</span>
                                  </div>
                                  <div className="col-md-6">
                                    <span className="text-muted small d-block">Email</span>
                                    <span className="fw-medium">{resumeData.analysis.extracted_email || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                {resumeData.analysis.summary && (
                                  <div className="mb-4">
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Professional Summary</h6>
                                    <p className="small mb-0 text-dark">{resumeData.analysis.summary}</p>
                                  </div>
                                )}
                                
                                {resumeData.analysis.extracted_skills?.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Skills</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                      {resumeData.analysis.extracted_skills.map((skill, i) => (
                                        <span key={i} className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {resumeData.analysis.experience?.filter(exp => exp.role || exp.company || exp.description)?.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Experience</h6>
                                    {resumeData.analysis.experience.filter(exp => exp.role || exp.company || exp.description).map((exp, i) => (
                                      <div key={i} className="mb-3 bg-white p-3 rounded border">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                          {exp.role && <div className="fw-bold text-dark">{exp.role}</div>}
                                          {exp.duration && <div className="text-muted small">{exp.duration}</div>}
                                        </div>
                                        {exp.company && <div className="text-primary small fw-medium mb-2">{exp.company}</div>}
                                        {exp.description && <p className="small mb-0 text-muted">{exp.description}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {resumeData.analysis.projects?.filter(proj => proj.title || proj.description)?.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Projects</h6>
                                    {resumeData.analysis.projects.filter(proj => proj.title || proj.description).map((proj, i) => (
                                      <div key={i} className="mb-3 bg-white p-3 rounded border">
                                        {proj.title && <div className="fw-bold text-dark mb-1">{proj.title}</div>}
                                        {proj.description && <p className="small mb-0 text-muted">{proj.description}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {resumeData.analysis.education?.filter(edu => edu.degree || edu.institution)?.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Education</h6>
                                    {resumeData.analysis.education.filter(edu => edu.degree || edu.institution).map((edu, i) => (
                                      <div key={i} className="mb-2 bg-white p-3 rounded border">
                                        {edu.degree && <div className="fw-medium text-dark">{edu.degree}</div>}
                                        {(edu.institution || edu.duration) && (
                                          <div className="text-muted small">
                                            {edu.institution}{edu.institution && edu.duration ? ' | ' : ''}{edu.duration}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                               <div className="text-center py-5 text-muted d-flex flex-column justify-content-center h-100">
                                <i className="bi bi-robot fs-1 mb-2"></i>
                                <p className="small mb-0">No parsed data available for this resume yet.</p>
                              </div>
                            )}
                          </div>
                        )}
                        {resumeTab === 'original' && (
                          <div className="rounded-4 overflow-hidden border shadow-sm" style={{ height: '550px' }}>
                            <object data={resumeData.url} type="application/pdf" width="100%" height="100%">
                              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted bg-light">
                                <i className="bi bi-file-earmark-pdf display-1 mb-3 text-secondary"></i>
                                <p className="mb-3 fw-medium">Browser preview unavailable</p>
                                <a href={resumeData.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary rounded-pill px-4 shadow-sm">
                                  <i className="bi bi-download me-2"></i>Download PDF
                                </a>
                              </div>
                            </object>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-muted bg-light rounded-4 border border-dashed">
                        <i className="bi bi-file-earmark-x display-1 mb-3 text-secondary opacity-50"></i>
                        <h5 className="fw-bold text-dark">No Resume Found</h5>
                        <p className="mb-0">This candidate did not upload a resume document.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons spanning full width at bottom */}
            {activeApp.status !== 'accepted' && activeApp.status !== 'rejected' && (
              <div className="bg-light border rounded-4 p-4 mt-4 d-flex flex-column flex-md-row justify-content-between align-items-center shadow-sm">
                <div className="mb-3 mb-md-0">
                  <h6 className="fw-bold text-dark mb-1">Process Application</h6>
                  <div className="text-muted small">Select the next stage for this candidate.</div>
                </div>
                <div className="d-flex flex-wrap gap-3">
                  <button 
                    className="btn btn-outline-danger fw-bold px-4 py-2 rounded-pill shadow-sm" 
                    onClick={() => handleStatusUpdateClick('rejected')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-x-circle me-2"></i>Reject
                  </button>
                  {activeApp.status === 'face_to_face_interview' ? (
                    <button 
                      className="btn btn-success fw-bold px-4 py-2 rounded-pill shadow-sm" 
                      onClick={() => handleStatusUpdateClick('accepted')}
                      disabled={isUpdating}
                    >
                      <i className="bi bi-check-circle me-2"></i>Accept Candidate
                    </button>
                  ) : activeApp.status === 'technical_round' ? (
                    <button 
                      className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-sm" 
                      onClick={() => handleStatusUpdateClick('face_to_face_interview')}
                      disabled={isUpdating || !activeApp.tests?.find(t => t.test_type === 'TECHNICAL')?.is_completed}
                    >
                      Proceed to Interview <i className="bi bi-arrow-right-circle ms-2"></i>
                    </button>
                  ) : activeApp.status === 'aptitude_round' ? (
                    <button 
                      className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-sm" 
                      onClick={() => handleStatusUpdateClick('technical_round')}
                      disabled={isUpdating || !activeApp.tests?.find(t => t.test_type === 'APTITUDE')?.is_completed}
                    >
                      Proceed to Technical <i className="bi bi-arrow-right-circle ms-2"></i>
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-sm" 
                      onClick={() => handleStatusUpdateClick('aptitude_round')}
                      disabled={isUpdating}
                    >
                      Proceed to Aptitude <i className="bi bi-arrow-right-circle ms-2"></i>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Admin Test View Modal */}
      <Modal isOpen={!!viewTestId} onClose={() => setViewTestId(null)} title="Candidate Test Answers" size="lg">
        <div className="p-2">
          {isFetchingTest ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <div className="text-muted small">Loading test details...</div>
            </div>
          ) : testAnswersData ? (
            <div className="bg-light rounded-4 p-4 border mb-3 position-relative">
              {isEvaluatingTest && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: 'inherit' }}>
                  <div className="spinner-grow text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                  <h5 className="fw-bold text-dark">AI is analyzing candidate's code...</h5>
                  <p className="text-muted small">This usually takes a few seconds.</p>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h5 className="fw-bold text-dark mb-0">Test Results</h5>
                <div className="d-flex align-items-center gap-3">
                  {testAnswersData.test_type === 'TECHNICAL' && testAnswersData.score === null && (
                    <button 
                      className="btn btn-primary rounded-pill px-4 shadow-sm fw-medium d-flex align-items-center gap-2"
                      onClick={() => evaluateTest(testAnswersData.id)}
                      disabled={isEvaluatingTest}
                    >
                      <i className="bi bi-robot"></i> Evaluate with AI
                    </button>
                  )}
                  {testAnswersData.score !== null ? (
                    <div className={`fs-3 fw-bold ${testAnswersData.score >= 70 ? 'text-success' : 'text-danger'}`}>
                      {Number(testAnswersData.score).toFixed(0)}%
                    </div>
                  ) : (
                    <div className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fs-6">
                      Pending Review
                    </div>
                  )}
                </div>
              </div>
              
              <div className="d-flex flex-column gap-4">
                {testAnswersData.answers?.map((ans, idx) => (
                  <div key={ans.id} className="bg-white p-4 rounded shadow-sm border border-light">
                    <div className="d-flex gap-3 align-items-start">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 ${ans.question?.type === 'PROGRAMMING' ? 'bg-primary' : ans.is_correct ? 'bg-success' : 'bg-danger'}`} style={{width: '32px', height: '32px'}}>
                        <i className={`bi ${ans.question?.type === 'PROGRAMMING' ? 'bi-code-slash' : ans.is_correct ? 'bi-check-lg' : 'bi-x-lg'}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold text-dark mb-3">
                          <span className="text-muted me-2">{idx + 1}.</span>
                          {ans.question?.question}
                        </h6>
                        
                        {ans.question?.type === 'PROGRAMMING' ? (
                          <div className="p-3 border rounded bg-light-subtle h-100 position-relative">
                            <span className="badge bg-secondary position-absolute top-0 start-50 translate-middle">Candidate Code ({ans.language || 'Unknown'})</span>
                            <pre className="mt-3 mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                              {ans.selected_answer || <span className="text-muted fst-italic">No code submitted</span>}
                            </pre>
                          </div>
                        ) : (
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="p-3 border rounded bg-light-subtle h-100 position-relative">
                                <span className="badge bg-secondary position-absolute top-0 start-50 translate-middle">Candidate Answer</span>
                                <div className={`mt-2 fw-medium ${ans.is_correct ? 'text-success' : 'text-danger'}`}>
                                  {ans.selected_answer || <span className="text-muted fst-italic">No answer selected</span>}
                                </div>
                              </div>
                            </div>
                            
                            {!ans.is_correct && (
                              <div className="col-md-6">
                                <div className="p-3 border rounded bg-success-subtle border-success-subtle h-100 position-relative">
                                  <span className="badge bg-success position-absolute top-0 start-50 translate-middle">Correct Answer</span>
                                  <div className="mt-2 fw-medium text-success">
                                    {ans.question && (
                                      ans.question.correct_answer === 'A' ? ans.question.option_a :
                                      ans.question.correct_answer === 'B' ? ans.question.option_b :
                                      ans.question.correct_answer === 'C' ? ans.question.option_c :
                                      ans.question.option_d
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-exclamation-triangle fs-1 mb-2"></i>
              <p>Failed to load test answers.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;
