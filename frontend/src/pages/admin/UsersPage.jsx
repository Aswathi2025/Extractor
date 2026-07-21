import { useState, useEffect } from 'react';
import { useUsers, useUser, useUpdateUserStatus, useUserResume } from '../../hooks/useUsers';
import Modal from '../../components/ui/Modal';
import moment from 'moment';

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [viewUser, setViewUser] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showResume, setShowResume] = useState(false);

  const { data: response, isLoading } = useUsers({ page, limit: 10, search });
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateUserStatus();
  
  // Fetch detailed user data for the modal
  const { data: detailedUser, isLoading: isDetailedUserLoading } = useUser(viewUser?.id);
  
  // Use query for resume fetching, enabled only when showResume is true
  const { data: resumeUrl, isLoading: isResumeLoading, isError: isResumeError, refetch: fetchResume } = useUserResume(viewUser?.id);

  useEffect(() => {
    if (!viewUser) {
      setShowResume(false);
    }
  }, [viewUser]);

  useEffect(() => {
    if (showResume && viewUser) {
      fetchResume();
    }
  }, [showResume, viewUser, fetchResume]);

  const users = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1 };

  const handleStatusChange = (id, newStatus) => {
    updateStatus({ id, status: newStatus });
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      updateStatus({ id: deleteConfirmId, status: 'DELETED' }, {
        onSuccess: () => setDeleteConfirmId(null),
      });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-0">Users</h4>
      </div>

      <div className="bg-white rounded-4 shadow-soft border p-4 mb-4">
        <div className="mb-4" style={{ maxWidth: '300px' }}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="text" 
              className="form-control input-stylish ps-5" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted">No users found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th className="fw-semibold text-muted small text-uppercase">User</th>
                  <th className="fw-semibold text-muted small text-uppercase">Role</th>
                  <th className="fw-semibold text-muted small text-uppercase">Joined</th>
                  <th className="fw-semibold text-muted small text-uppercase" style={{ width: '150px' }}>Status</th>
                  <th className="fw-semibold text-muted small text-uppercase text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="fw-medium text-dark">{user.username}</div>
                      <div className="text-muted small">{user.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'} border text-capitalize`}>
                        {user.role.toLowerCase()}
                      </span>
                    </td>
                    <td className="text-muted small">{moment(user.createdAt || user.created_at).format('MMM DD, YYYY')}</td>
                    <td>
                      <select 
                        className={`form-select form-select-sm fw-medium shadow-none ${user.status === 'ACTIVE' ? 'text-success bg-success-subtle border-success-subtle' : 'text-danger bg-danger-subtle border-danger-subtle'}`}
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        disabled={isUpdating}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="ACTIVE" className="bg-white text-dark">Active</option>
                        <option value="BLOCKED" className="bg-white text-dark">Blocked</option>
                      </select>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-light text-primary border-0 me-2" 
                        title="View Details"
                        onClick={() => setViewUser(user)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-light text-danger border-0" 
                        title="Delete User"
                        onClick={() => setDeleteConfirmId(user.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-muted">Showing page {meta.page} of {meta.totalPages}</div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light border" disabled={meta.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
              <button className="btn btn-sm btn-light border" disabled={meta.page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="xl">
        {isDetailedUserLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            <div className="mt-3 text-muted fw-medium tracking-wide">Retrieving user profile...</div>
          </div>
        ) : detailedUser ? (
          <div className="row g-4">
            {/* Left Column: Profile Info */}
            <div className="col-lg-5 col-xl-4 d-flex flex-column">
              {/* Header / Profile Section */}
              <div className="position-relative bg-primary-subtle rounded-4 p-4 mb-4 text-center overflow-hidden">
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-white" style={{ opacity: 0.4 }}></div>
                <div className="position-relative z-1 d-flex flex-column align-items-center">
                  <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm border border-primary-subtle" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-person-bounding-box fs-1"></i>
                  </div>
                  <h4 className="mb-1 fw-bold text-dark">{detailedUser.username}</h4>
                  <p className="text-muted mb-2 d-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-envelope"></i> {detailedUser.email}
                  </p>
                  <div className="d-flex gap-2 justify-content-center mt-2">
                    <span className={`badge px-3 py-2 rounded-pill ${detailedUser.role === 'admin' ? 'bg-danger text-white' : 'bg-primary text-white'} text-capitalize shadow-sm`}>
                      <i className={`bi ${detailedUser.role === 'admin' ? 'bi-shield-lock' : 'bi-person-badge'} me-2`}></i>
                      {detailedUser.role.toLowerCase()}
                    </span>
                    <span className={`badge px-3 py-2 rounded-pill ${detailedUser.status === 'ACTIVE' ? 'bg-success text-white' : 'bg-secondary text-white'} shadow-sm`}>
                      {detailedUser.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Details Grid */}
              <h6 className="fw-bold text-dark mb-3 px-1"><i className="bi bi-info-circle me-2 text-primary"></i>Profile Information</h6>
              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <div className="bg-light rounded-4 p-3 border h-100 transition-hover">
                    <label className="small text-muted fw-semibold text-uppercase tracking-wide mb-1 d-block"><i className="bi bi-telephone me-1"></i>Phone</label>
                    <div className="fw-bold text-dark">{detailedUser.phone || 'Not Provided'}</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="bg-light rounded-4 p-3 border h-100 transition-hover">
                    <label className="small text-muted fw-semibold text-uppercase tracking-wide mb-1 d-block"><i className="bi bi-check-circle me-1"></i>Verified</label>
                    <div className="d-flex align-items-center fw-bold">
                      {detailedUser.is_verified ? (
                        <span className="text-success"><i className="bi bi-patch-check-fill me-1"></i> Yes</span>
                      ) : (
                        <span className="text-warning"><i className="bi bi-exclamation-circle-fill me-1"></i> No</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="bg-light rounded-4 p-3 border transition-hover">
                    <label className="small text-muted fw-semibold text-uppercase tracking-wide mb-1 d-block"><i className="bi bi-calendar3 me-1"></i>Member Since</label>
                    <div className="fw-bold text-dark">{moment(detailedUser.createdAt || detailedUser.created_at).format('MMMM DD, YYYY [at] hh:mm A')}</div>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              {(detailedUser.website || detailedUser.linkedin_url || detailedUser.github_url) && (
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3 px-1"><i className="bi bi-link-45deg me-2 text-primary"></i>Web & Social</h6>
                  <div className="bg-light rounded-4 p-3 border d-flex flex-wrap gap-2 transition-hover">
                    {detailedUser.website && <a href={detailedUser.website} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info rounded-pill px-3 fw-medium"><i className="bi bi-globe me-2"></i>Website</a>}
                    {detailedUser.linkedin_url && <a href={detailedUser.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium"><i className="bi bi-linkedin me-2"></i>LinkedIn</a>}
                    {detailedUser.github_url && <a href={detailedUser.github_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-medium"><i className="bi bi-github me-2"></i>GitHub</a>}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Resume Section */}
            <div className="col-lg-7 col-xl-8 d-flex flex-column">
              <h6 className="fw-bold text-dark mb-3 px-1"><i className="bi bi-file-earmark-person me-2 text-primary"></i>Resume Document</h6>
              
              <div className="flex-grow-1 d-flex flex-column h-100" style={{ minHeight: '600px' }}>
                {!showResume ? (
                  <div className="bg-light border border-dashed rounded-4 p-5 text-center transition-hover d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setShowResume(true)}>
                    <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm mb-3 text-primary" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-file-earmark-pdf fs-1"></i>
                    </div>
                    <h5 className="fw-bold mb-2">View Candidate Resume</h5>
                    <p className="text-muted small mb-0 px-4">Click here to securely fetch and load the candidate's PDF document in this pane.</p>
                  </div>
                ) : isResumeLoading ? (
                  <div className="bg-light border rounded-4 p-5 text-center d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                    <h6 className="fw-bold text-muted tracking-wide">Loading Document...</h6>
                  </div>
                ) : isResumeError || !resumeUrl ? (
                  <div className="bg-danger-subtle border border-danger-subtle rounded-4 p-4 text-center d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                    <h5 className="fw-bold text-danger mb-0">No resume available for this user.</h5>
                  </div>
                ) : (
                  <div className="border rounded-4 overflow-hidden bg-dark shadow-sm position-relative flex-grow-1 d-flex flex-column">
                    <div className="bg-white p-2 d-flex justify-content-between align-items-center border-bottom shadow-sm z-1">
                      <span className="fw-semibold text-dark small px-2"><i className="bi bi-file-earmark-pdf text-danger me-2"></i>Candidate_Resume.pdf</span>
                      <a href={resumeUrl?.url || resumeUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary rounded-pill px-3">
                        <i className="bi bi-download me-1"></i> Download
                      </a>
                    </div>
                    <object data={resumeUrl?.url || resumeUrl} type="application/pdf" width="100%" className="flex-grow-1">
                      <div className="p-5 text-center bg-light h-100 d-flex flex-column align-items-center justify-content-center">
                        <i className="bi bi-file-earmark-x text-muted fs-1 mb-3"></i>
                        <p className="text-muted mb-3">Your browser cannot display PDFs directly.</p>
                        <a href={resumeUrl?.url || resumeUrl} target="_blank" rel="noreferrer" className="btn btn-primary rounded-pill px-4">
                          <i className="bi bi-download me-2"></i>Download PDF
                        </a>
                      </div>
                    </object>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Confirm Deletion" size="sm">
        <p className="text-muted mb-4">Are you sure you want to delete this user? This will hide them from the platform. This action cannot be undone.</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light border" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isUpdating}>
            {isUpdating ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
