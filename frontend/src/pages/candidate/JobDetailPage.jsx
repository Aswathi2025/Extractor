import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJobById } from '../../hooks/useJobs';
import { useUploadResume, useApplyForJob, useMyApplications, useCurrentResume } from '../../hooks/useApplications';
import Modal from '../../components/ui/Modal';
import moment from 'moment';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading, isError } = useJobById(id);
  const { data: myAppsData } = useMyApplications();
  const { data: currentResumeData, isLoading: isResumeLoading } = useCurrentResume();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState(null);
  const [resumeMode, setResumeMode] = useState('existing'); // 'existing' or 'new'

  const { mutate: uploadResume, isPending: isUploading } = useUploadResume();
  const { mutate: applyForJob, isPending: isApplying } = useApplyForJob();

  const myApplications = myAppsData?.data || [];
  const isAlreadyApplied = myApplications.some(app => app.job_role_id === id);

  const currentResumeUrl = currentResumeData?.data?.url;
  const hasExistingResume = !!currentResumeUrl;

  useEffect(() => {
    if (isModalOpen) {
      if (hasExistingResume) {
        setResumeMode('existing');
      } else {
        setResumeMode('new');
      }
    }
  }, [isModalOpen, hasExistingResume]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-3 text-muted">Loading job details...</div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="text-center py-5 bg-white rounded-4 shadow-soft border">
        <div className="text-danger fs-1 mb-3"><i className="bi bi-exclamation-circle"></i></div>
        <h5 className="fw-bold">Job Not Found</h5>
        <p className="text-muted">The job you are looking for does not exist or has been removed.</p>
        <Link to="/jobs" className="btn btn-primary mt-3">Back to Jobs</Link>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const formData = new FormData();
    formData.append('file', file);

    uploadResume(formData, {
      onSuccess: (res) => {
        setUploadedResumeUrl(res.data.url);
      }
    });
  };

  const handleApply = () => {
    applyForJob(
      { job_role_id: job.id },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          navigate('/applications'); 
        }
      }
    );
  };

  const activePreviewUrl = resumeMode === 'existing' ? currentResumeUrl : uploadedResumeUrl;

  return (
    <div>
      <div className="mb-4 d-flex align-items-center">
        <Link to="/jobs" className="btn btn-light rounded-circle shadow-sm me-3" style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-arrow-left"></i>
        </Link>
        <div>
          <h4 className="fw-bold tracking-tight text-dark mb-0">Job Details</h4>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-soft border p-4 p-md-5 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-4 gap-3 border-bottom pb-4">
          <div>
            <div className="d-flex align-items-center gap-3 mb-2">
              <h2 className="fw-bold text-dark mb-0">{job.title}</h2>
              {isAlreadyApplied && (
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">
                  <i className="bi bi-check2-circle me-1"></i> Applied
                </span>
              )}
            </div>
            <div className="d-flex flex-wrap gap-3 text-muted small mt-2">
              <span className="d-flex align-items-center"><i className="bi bi-briefcase me-2"></i>{job.min_experience}+ Years Experience</span>
              <span className="d-flex align-items-center"><i className="bi bi-mortarboard me-2"></i>{job.min_education}</span>
            </div>
          </div>
          <div className="text-md-end">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2 d-inline-block border border-primary-subtle">
              Actively Recruiting
            </span>
            <div className="text-muted small">
              Apply by: <span className="fw-medium text-dark">{job.last_application_date ? moment(job.last_application_date).format('MMMM DD, YYYY') : 'Ongoing'}</span>
            </div>
          </div>
        </div>

        <div className="row g-5">
          <div className="col-12 col-lg-8">
            <h5 className="fw-bold text-dark mb-3">About the Role</h5>
            <div className="text-muted mb-5" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
              {job.description}
            </div>

            <h5 className="fw-bold text-dark mb-3">Required Skills</h5>
            <div className="d-flex flex-wrap gap-2 mb-5">
              {job.required_skills?.map(skill => (
                <span key={skill.id} className="bg-light border text-dark px-3 py-2 rounded-pill fw-medium small">
                  {skill.name}
                </span>
              ))}
              {!job.required_skills?.length && <span className="text-muted fst-italic">No specific skills listed.</span>}
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="bg-light rounded-4 p-4 border">
              {isAlreadyApplied ? (
                <>
                  <h5 className="fw-bold text-success mb-3"><i className="bi bi-check-circle-fill me-2"></i>Application Submitted</h5>
                  <p className="text-muted small mb-0">
                    You have successfully applied for this position. We will review your application and get back to you soon.
                  </p>
                </>
              ) : (
                <>
                  <h5 className="fw-bold text-dark mb-3">Ready to join us?</h5>
                  <p className="text-muted small mb-4">
                    We're looking for passionate individuals. Apply now to start your journey with us!
                  </p>
                  <button 
                    className="btn btn-primary w-100 rounded-pill fw-medium py-2 shadow-sm mb-3"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Apply for this Job
                  </button>
                  <div className="text-center">
                    <small className="text-muted"><i className="bi bi-shield-check me-1"></i>Secure Application Process</small>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Job" size="lg">
        <div className="p-2">
          <h5 className="fw-bold text-dark mb-1">{job.title}</h5>
          
          {isResumeLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
              <div className="text-muted small mt-2">Checking your profile...</div>
            </div>
          ) : (
            <>
              {hasExistingResume ? (
                <div className="mb-4 mt-3">
                  <div className="d-flex bg-light p-1 rounded-pill mb-4 border">
                    <button 
                      className={`btn w-50 rounded-pill fw-medium ${resumeMode === 'existing' ? 'btn-primary shadow-sm' : 'btn-light border-0 text-muted'}`}
                      onClick={() => setResumeMode('existing')}
                    >
                      <i className="bi bi-file-earmark-check me-2"></i>Use Existing Resume
                    </button>
                    <button 
                      className={`btn w-50 rounded-pill fw-medium ${resumeMode === 'new' ? 'btn-primary shadow-sm' : 'btn-light border-0 text-muted'}`}
                      onClick={() => setResumeMode('new')}
                    >
                      <i className="bi bi-upload me-2"></i>Upload New
                    </button>
                  </div>
                  {resumeMode === 'existing' && (
                    <p className="text-muted small text-center mb-0">
                      We found your resume on file. You can proceed with it or choose to upload a new one.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted small mb-4 mt-2">Please upload your latest resume to continue with the application.</p>
              )}

              {resumeMode === 'new' && (
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Upload Resume (PDF)</label>
                  <input 
                    type="file" 
                    className="form-control bg-light" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={isUploading || isApplying}
                  />
                </div>
              )}

              {isUploading && (
                <div className="text-center py-4 bg-light rounded border mb-4">
                  <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                  <div className="text-muted small mt-2">Uploading resume to secure storage...</div>
                </div>
              )}

              {activePreviewUrl && !isUploading && (
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Resume Preview</label>
                  <div className="border rounded bg-light overflow-hidden" style={{ height: '400px' }}>
                    <object
                      data={activePreviewUrl}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      style={{ minHeight: '400px' }}
                    >
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                        <i className="bi bi-file-earmark-pdf fs-1 mb-2"></i>
                        <p className="mb-2">Preview unavailable</p>
                        <a href={activePreviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary rounded-pill">
                          View Resume
                        </a>
                      </div>
                    </object>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-4">
                <button className="btn btn-light border fw-medium rounded-pill px-4" onClick={() => setIsModalOpen(false)} disabled={isApplying || isUploading}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary fw-medium rounded-pill px-4 shadow-sm" 
                  onClick={handleApply} 
                  disabled={(resumeMode === 'new' && !uploadedResumeUrl) || isApplying || isUploading}
                >
                  {isApplying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default JobDetailPage;
