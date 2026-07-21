import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSkills, useCreateSkill, useDeleteSkill } from '../../hooks/useSkills';
import Modal from '../../components/ui/Modal';
import moment from 'moment';

const schema = yup.object().shape({
  name: yup.string().required('Skill name is required').min(2, 'Too short'),
});

const SkillsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data: response, isLoading } = useSkills({ page, limit: 10, search });
  const { mutate: createSkill, isPending: isCreating } = useCreateSkill();
  const { mutate: deleteSkill, isPending: isDeleting } = useDeleteSkill();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    createSkill(data, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteSkill(deleteConfirmId, {
        onSuccess: () => setDeleteConfirmId(null),
      });
    }
  };

  const skills = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1 };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-0">Skills</h4>
        <button className="btn btn-dark fw-medium shadow-sm" onClick={() => setIsAddModalOpen(true)}>
          <i className="bi bi-plus-lg me-2"></i>Add Skill
        </button>
      </div>

      <div className="bg-white rounded-4 shadow-soft border p-4 mb-4">
        <div className="mb-4" style={{ maxWidth: '300px' }}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="text" 
              className="form-control input-stylish ps-5" 
              placeholder="Search skills..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : skills.length === 0 ? (
          <div className="text-center py-5 text-muted">No skills found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th className="fw-semibold text-muted small text-uppercase">Name</th>
                  <th className="fw-semibold text-muted small text-uppercase">Created At</th>
                  <th className="fw-semibold text-muted small text-uppercase text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id}>
                    <td className="fw-medium text-dark">{skill.name}</td>
                    <td className="text-muted small">{moment(skill.created_at).format('MMM DD, YYYY')}</td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-light text-danger border-0" 
                        title="Delete"
                        onClick={() => setDeleteConfirmId(skill.id)}
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

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-muted">
              Showing page {meta.page} of {meta.totalPages}
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-light border" 
                disabled={meta.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button 
                className="btn btn-sm btn-light border" 
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Skill">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="form-label small fw-semibold text-dark">Skill Name</label>
            <input 
              type="text" 
              className={`form-control input-stylish ${errors.name ? 'is-invalid' : ''}`} 
              placeholder="e.g., React, Python, UI/UX"
              {...register('name')} 
            />
            {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-dark" disabled={isCreating}>
              {isCreating ? 'Saving...' : 'Save Skill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Confirm Deletion" size="sm">
        <p className="text-muted mb-4">Are you sure you want to delete this skill? This action cannot be undone.</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light border" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SkillsPage;
