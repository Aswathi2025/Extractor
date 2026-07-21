import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, useGenerateQuestion } from '../../hooks/useQuestions';
import Modal from '../../components/ui/Modal';

import * as questionsApi from '../../api/questions.api';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  type: yup.string().required('Type is required').oneOf(['MCQ', 'PROGRAMMING']),
  question: yup.string().required('Question is required'),
  option_a: yup.string().when('type', {
    is: 'MCQ',
    then: (schema) => schema.required('Option A is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  option_b: yup.string().when('type', {
    is: 'MCQ',
    then: (schema) => schema.required('Option B is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  option_c: yup.string().when('type', {
    is: 'MCQ',
    then: (schema) => schema.required('Option C is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  option_d: yup.string().when('type', {
    is: 'MCQ',
    then: (schema) => schema.required('Option D is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  correct_answer: yup.string().when('type', {
    is: 'MCQ',
    then: (schema) => schema.required('Correct answer is required').oneOf(['A', 'B', 'C', 'D']),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
});

const QuestionsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, data: null });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  const { data: response, isLoading } = useQuestions({ page, limit: 10, search });
  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion();
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion();
  const { mutate: generateQuestionWithAI, isPending: isGeneratingQuestion } = useGenerateQuestion();
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'MCQ',
      correct_answer: 'A'
    }
  });

  const selectedType = watch('type');

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleGenerateQuestion = () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic to generate questions.');
      return;
    }
    
    generateQuestionWithAI({ topic: aiTopic, difficulty: aiDifficulty }, {
      onSuccess: () => {
        setIsBulkModalOpen(false);
        setAiTopic('');
      }
    });
  };

  const openModal = async (id = null) => {
    if (id) {
      try {
        setIsFetchingDetail(true);
        const { data } = await questionsApi.getQuestionById(id);
        const q = data;
        let mappedCorrectAnswer = q.correct_answer;
        if (!['A', 'B', 'C', 'D'].includes(mappedCorrectAnswer)) {
          if (mappedCorrectAnswer === q.option_a) mappedCorrectAnswer = 'A';
          else if (mappedCorrectAnswer === q.option_b) mappedCorrectAnswer = 'B';
          else if (mappedCorrectAnswer === q.option_c) mappedCorrectAnswer = 'C';
          else if (mappedCorrectAnswer === q.option_d) mappedCorrectAnswer = 'D';
        }

        reset({
          type: q.type || 'MCQ',
          question: q.question,
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          correct_answer: mappedCorrectAnswer || 'A',
        });
        setModalState({ isOpen: true, data: q });
      } catch (err) {
        toast.error('Failed to fetch question details');
      } finally {
        setIsFetchingDetail(false);
      }
    } else {
      reset({ type: 'MCQ', question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A' });
      setModalState({ isOpen: true, data: null });
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, data: null });
    reset();
  };

  const onSubmit = (data) => {
    const payload = { ...data };
    if (payload.type === 'PROGRAMMING') {
      delete payload.option_a;
      delete payload.option_b;
      delete payload.option_c;
      delete payload.option_d;
      delete payload.correct_answer;
    }
    
    if (modalState.data?.id) {
      updateQuestion({ id: modalState.data.id, data: payload }, { onSuccess: closeModal });
    } else {
      createQuestion(payload, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteQuestion(deleteConfirmId, {
        onSuccess: () => setDeleteConfirmId(null),
      });
    }
  };

  const questions = response?.data || [];
  const meta = response?.meta || { totalPages: 1, page: 1 };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-0">Questions</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary fw-medium shadow-sm d-flex align-items-center gap-2" onClick={() => setIsBulkModalOpen(true)}>
            <i className="bi bi-magic"></i>Generate 10 Questions
          </button>
          <button className="btn btn-dark fw-medium shadow-sm" onClick={() => openModal()}>
            <i className="bi bi-plus-lg me-2"></i>Add Question
          </button>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-soft border p-4 mb-4">
        <div className="mb-4" style={{ maxWidth: '300px' }}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
            <input 
              type="text" 
              className="form-control input-stylish ps-5" 
              placeholder="Search questions..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-5 text-muted">No questions found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th className="fw-semibold text-muted small text-uppercase">Question</th>
                  <th className="fw-semibold text-muted small text-uppercase">Type</th>
                  <th className="fw-semibold text-muted small text-uppercase">Correct Option</th>
                  <th className="fw-semibold text-muted small text-uppercase text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td className="fw-medium text-dark">
                      <div className="text-truncate" style={{maxWidth: '400px'}} title={q.question}>{q.question}</div>
                    </td>
                    <td>
                      <span className={`badge ${q.type === 'PROGRAMMING' ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'} border`}>
                        {q.type || 'MCQ'}
                      </span>
                    </td>
                    <td>
                      {q.type === 'PROGRAMMING' ? (
                        <span className="text-muted small">Manual Review</span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">Option {q.correct_answer}</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-light text-primary border-0 me-2" 
                        title="Edit"
                        onClick={() => openModal(q.id)}
                        disabled={isFetchingDetail}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-light text-danger border-0" 
                        title="Delete"
                        onClick={() => setDeleteConfirmId(q.id)}
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

      {/* Add/Edit Question Modal */}
      <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.data ? 'Edit Question' : 'Add New Question'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>


          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Question Type</label>
            <select className={`form-select input-stylish ${errors.type ? 'is-invalid' : ''}`} {...register('type')}>
              <option value="MCQ">Multiple Choice (MCQ)</option>
              <option value="PROGRAMMING">Programming</option>
            </select>
            {errors.type && <div className="invalid-feedback">{errors.type.message}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Question Text</label>
            <textarea 
              className={`form-control input-stylish ${errors.question ? 'is-invalid' : ''}`} 
              rows="3"
              placeholder={selectedType === 'PROGRAMMING' ? "Enter the programming problem statement..." : "Enter the test question..."}
              {...register('question')} 
            />
            {errors.question && <div className="invalid-feedback">{errors.question.message}</div>}
          </div>
          
          {selectedType === 'MCQ' && (
            <>
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label small fw-semibold text-dark">Option A</label>
                  <input type="text" className={`form-control input-stylish ${errors.option_a ? 'is-invalid' : ''}`} {...register('option_a')} />
                  {errors.option_a && <div className="invalid-feedback">{errors.option_a.message}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Option B</label>
                  <input type="text" className={`form-control input-stylish ${errors.option_b ? 'is-invalid' : ''}`} {...register('option_b')} />
                  {errors.option_b && <div className="invalid-feedback">{errors.option_b.message}</div>}
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label small fw-semibold text-dark">Option C</label>
                  <input type="text" className={`form-control input-stylish ${errors.option_c ? 'is-invalid' : ''}`} {...register('option_c')} />
                  {errors.option_c && <div className="invalid-feedback">{errors.option_c.message}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Option D</label>
                  <input type="text" className={`form-control input-stylish ${errors.option_d ? 'is-invalid' : ''}`} {...register('option_d')} />
                  {errors.option_d && <div className="invalid-feedback">{errors.option_d.message}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Correct Answer</label>
                <select className={`form-select input-stylish ${errors.correct_answer ? 'is-invalid' : ''}`} {...register('correct_answer')}>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
                {errors.correct_answer && <div className="invalid-feedback">{errors.correct_answer.message}</div>}
              </div>
            </>
          )}

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-light border" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-dark" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Confirm Deletion" size="sm">
        <p className="text-muted mb-4">Are you sure you want to delete this question? This action cannot be undone.</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light border" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      {/* Bulk Generation Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Generate 10 AI Questions" size="md">
        <div className="bg-primary-subtle rounded-4 p-4 mb-4 border border-primary-subtle">
          <p className="text-muted small mb-4">
            The AI will generate 10 unique, high-quality multiple-choice questions based on your topic and save them directly to the database. This may take up to 20 seconds.
          </p>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark mb-1">Topic</label>
            <input type="text" className="form-control input-stylish bg-white" placeholder="e.g. React Hooks, Node.js Events" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} disabled={isGeneratingQuestion} />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold text-dark mb-1">Difficulty</label>
            <select className="form-select input-stylish bg-white" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} disabled={isGeneratingQuestion}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border" onClick={() => setIsBulkModalOpen(false)} disabled={isGeneratingQuestion}>Cancel</button>
            <button type="button" className="btn btn-primary fw-medium shadow-sm d-flex justify-content-center align-items-center gap-2" onClick={handleGenerateQuestion} disabled={isGeneratingQuestion}>
              {isGeneratingQuestion ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  <span>Generating (approx 15s)...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-magic"></i>
                  <span>Generate 10 Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionsPage;
