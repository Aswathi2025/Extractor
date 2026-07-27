import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob, useGenerateJobDescription } from '../../hooks/useJobs';
import { useSkills } from '../../hooks/useSkills';
import Modal from '../../components/ui/Modal';
import moment from 'moment';

import * as jobsApi from '../../api/jobs.api';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  min_education: yup.string().required('Min Education is required'),
  min_experience: yup.number().typeError('Must be a number').required('Min Experience is required').min(0, 'Cannot be negative'),
  last_application_date: yup.string().required('Last Application Date is required'),
  skill_ids: yup.array().of(yup.string()),
});

const JobsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, data: null });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  const { data: response, isLoading } = useJobs({ page, limit: 10, search });
  const { data: skillsResponse } = useSkills({ limit: 100 }); // fetch skills for the form
  const skillsList = skillsResponse?.data || [];

  const { mutate: createJob, isPending: isCreating } = useCreateJob();
  const { mutate: updateJob, isPending: isUpdating } = useUpdateJob();
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob();
  const { mutate: generateDescription, isPending: isGeneratingDesc } = useGenerateJobDescription();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { skill_ids: [] }
  });

  const selectedSkills = watch('skill_ids') || [];

  const handleGenerateDescription = () => {
    const title = watch('title');
    const minExperience = watch('min_experience');
    const minEducation = watch('min_education');
    const skillIds = watch('skill_ids') || [];
    
    const skills = skillsList.filter(s => skillIds.includes(s.id)).map(s => s.name);

    if (!title && skills.length === 0) {
      toast.error('Please enter a Job Title or select some skills first.');
      return;
    }

    generateDescription(
      { title, skill_ids: skillIds, min_experience: minExperience, min_education: minEducation },
      {
        onSuccess: (res) => {
          setValue('description', res.data.description, { shouldValidate: true });
        }
      }
    );
  };

  const openModal = async (id = null) => {
    if (id) {
      try {
        setIsFetchingDetail(true);
        const { data } = await jobsApi.getJobById(id);
        const job = data;
        reset({
          title: job.title,
          description: job.description,
          min_education: job.min_education,
          min_experience: job.min_experience,
          last_application_date: job.last_application_date || '',
          skill_ids: job.required_skills?.map(s => s.id) || [],
        });
        setModalState({ isOpen: true, data: job });
      } catch (err) {
        toast.error('Failed to fetch job details');
      } finally {
        setIsFetchingDetail(false);
      }
    } else {
      reset({ title: '', description: '', min_education: '', min_experience: 0, last_application_date: '', skill_ids: [] });
      setModalState({ isOpen: true, data: null });
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, data: null });
    reset();
  };

  const onSubmit = (data) => {
    if (modalState.data?.id) {
      updateJob({ id: modalState.data.id, data }, { onSuccess: closeModal });
    } else {
      createJob(data, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteJob(deleteConfirmId, { onSuccess: () => setDeleteConfirmId(null) });
    }
  };

  const handleSkillToggle = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setValue('skill_ids', selectedSkills.filter(id => id !== skillId));
    } else {
      setValue('skill_ids', [...selectedSkills, skillId]);
    }
  };

  const jobs = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1 };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-0">Jobs</h4>
        <button className="btn btn-dark fw-medium shadow-sm" onClick={() => openModal()}>
          <i className="bi bi-plus-lg me-2"></i>Add Job
        </button>
      </div>

      <div className="bg-white rounded-4 shadow-soft border p-4 mb-4">
        <div className="mb-4" style={{ maxWidth: '300px' }}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="text" 
              className="form-control input-stylish ps-5" 
              placeholder="Search jobs..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-5 text-muted">No jobs found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th className="fw-semibold text-muted small text-uppercase">Title</th>
                  <th className="fw-semibold text-muted small text-uppercase">Experience</th>
                  <th className="fw-semibold text-muted small text-uppercase">Last Date</th>
                  <th className="fw-semibold text-muted small text-uppercase">Skills</th>
                  <th className="fw-semibold text-muted small text-uppercase text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="fw-medium text-dark">{job.title}</td>
                    <td className="text-muted small">{job.min_experience} yrs</td>
                    <td className="text-muted small">{job.last_application_date ? moment(job.last_application_date).format('MMM DD, YYYY') : '-'}</td>
                    <td>
                      {job.required_skills?.map(s => (
                        <span key={s.id} className="badge bg-light text-dark border me-1">{s.name}</span>
                      ))}
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-light text-primary border-0 me-2" 
                        title="Edit"
                        onClick={() => openModal(job.id)}
                        disabled={isFetchingDetail}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-light text-danger border-0" 
                        title="Delete"
                        onClick={() => setDeleteConfirmId(job.id)}
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

      <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.data ? 'Edit Job' : 'Add New Job'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Job Title</label>
            <input type="text" className={`form-control input-stylish ${errors.title ? 'is-invalid' : ''}`} {...register('title')} />
            {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
          </div>


          <div className="row mb-3">
            <div className="col-md-4 mb-3 mb-md-0">
              <label className="form-label small fw-semibold text-dark">Min Education</label>
              <input type="text" className={`form-control input-stylish ${errors.min_education ? 'is-invalid' : ''}`} placeholder="e.g., Bachelor's Degree" {...register('min_education')} />
              {errors.min_education && <div className="invalid-feedback">{errors.min_education.message}</div>}
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <label className="form-label small fw-semibold text-dark">Min Experience (Years)</label>
              <input type="number" className={`form-control input-stylish ${errors.min_experience ? 'is-invalid' : ''}`} min="0" {...register('min_experience')} />
              {errors.min_experience && <div className="invalid-feedback">{errors.min_experience.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-dark">Last Application Date</label>
              <input type="date" className={`form-control input-stylish ${errors.last_application_date ? 'is-invalid' : ''}`} {...register('last_application_date')} />
              {errors.last_application_date && <div className="invalid-feedback">{errors.last_application_date.message}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-dark mb-2">Required Skills</label>
            <div className="d-flex flex-wrap gap-2 p-3 border rounded bg-light" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {skillsList.map(skill => (
                <button
                  key={skill.id}
                  type="button"
                  className={`btn btn-sm rounded-pill ${selectedSkills.includes(skill.id) ? 'btn-primary shadow-sm' : 'btn-outline-secondary bg-white'}`}
                  onClick={() => handleSkillToggle(skill.id)}
                >
                  {skill.name} {selectedSkills.includes(skill.id) && <i className="bi bi-check2 ms-1"></i>}
                </button>
              ))}
              {skillsList.length === 0 && <span className="text-muted small">No skills available. Add some in the Skills tab.</span>}
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label small fw-semibold text-dark mb-0">Description</label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary border-0 rounded-pill d-flex align-items-center gap-1 shadow-sm px-3"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDesc}
              >
                {isGeneratingDesc ? <span className="spinner-border spinner-border-sm me-1" role="status"></span> : <i className="bi bi-magic"></i>}
                <span className="small fw-bold">Auto-generate with AI</span>
              </button>
            </div>
            <textarea className={`form-control input-stylish ${errors.description ? 'is-invalid' : ''}`} rows="6" {...register('description')} />
            {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-light border" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-dark" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : 'Save Job'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Confirm Deletion" size="sm">
        <p className="text-muted mb-4">Are you sure you want to delete this job? This action cannot be undone.</p>
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

export default JobsPage;
