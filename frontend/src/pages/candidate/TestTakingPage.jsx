import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTestById, useSubmitTest } from '../../hooks/useTests';
import Modal from '../../components/ui/Modal';

const TestTakingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: test, isLoading, isError } = useTestById(id);
  const { mutate: submitTest, isPending } = useSubmitTest();
  
  const [answers, setAnswers] = useState({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted small">Loading test...</div>
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="text-center py-5 text-danger">
        <i className="bi bi-exclamation-circle fs-1 mb-2"></i>
        <h6>Failed to load test</h6>
        <button className="btn btn-outline-secondary btn-sm mt-3" onClick={() => navigate('/tests')}>Back to Tests</button>
      </div>
    );
  }

  const handleOptionChange = (answerId, optionValue) => {
    setAnswers(prev => ({
      ...prev,
      [answerId]: { selectedAnswer: optionValue }
    }));
  };

  const handleProgrammingChange = (answerId, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    setIsSubmitModalOpen(true);
  };

  const confirmSubmit = () => {
    const payload = Object.entries(answers).map(([answerId, data]) => ({
      answerId,
      selectedAnswer: data.selectedAnswer || data.code || '',
      language: data.language || null
    }));

    submitTest({ id: test.id, answers: payload }, {
      onSuccess: () => {
        setIsSubmitModalOpen(false);
        window.scrollTo(0, 0);
      }
    });
  };

  const isAllAnswered = test.answers?.length > 0 && Object.keys(answers).length === test.answers.length && 
    Object.values(answers).every(a => (a.selectedAnswer || (a.code && a.language)));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="d-flex align-items-center mb-4 gap-3">
        <button className="btn btn-light rounded-circle p-2 d-flex shadow-sm" onClick={() => navigate('/tests')}>
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <div>
          <h4 className="fw-bold tracking-tight text-dark mb-0">Assessment Test</h4>
          <p className="text-muted mb-0 small">Answer all questions carefully before submitting.</p>
        </div>
      </div>

      {test.is_completed ? (
        <div className="bg-white p-5 rounded-4 border shadow-sm text-center mb-4">
          {test.test_type === 'TECHNICAL' ? (
            <>
              <div className="mb-4">
                <i className="bi bi-hourglass-split text-primary display-1"></i>
              </div>
              <h2 className="fw-bold text-dark mb-2">Test Submitted</h2>
              <p className="text-muted mb-4">Your programming assessment has been submitted successfully.</p>
              <div className="d-inline-block border border-primary-subtle rounded-4 p-4 bg-primary-subtle">
                <div className="fw-bold text-primary mb-1">Under Manual Review</div>
                <div className="small text-dark">
                  Your code submissions are currently being reviewed by the administration.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <i className={`bi ${test.score >= 70 ? 'bi-trophy text-warning' : 'bi-info-circle text-info'} display-1`}></i>
              </div>
              <h2 className="fw-bold text-dark mb-2">Test Completed</h2>
              <p className="text-muted mb-4">You have already submitted this assessment.</p>
              <div className="d-inline-block border rounded-4 p-4 bg-light">
                <div className="small text-uppercase fw-bold text-muted mb-1">Your Score</div>
                <div className={`display-4 fw-bold ${test.score >= 70 ? 'text-success' : 'text-danger'}`}>
                  {Number(test.score || 0).toFixed(0)}%
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-4 border shadow-sm overflow-hidden mb-5">
          <div className="p-4 border-bottom bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">Questions ({test.total_questions})</span>
              <span className="badge bg-primary rounded-pill px-3 py-2">
                {Object.keys(answers).length} / {test.total_questions} Answered
              </span>
            </div>
          </div>
          
          <div className="p-4 p-md-5">
            {test.answers?.map((ans, idx) => (
              <div key={ans.id} className="mb-5 pb-4 border-bottom last-border-0">
                <h5 className="fw-semibold text-dark mb-4">
                  <span className="text-primary me-2">{idx + 1}.</span> 
                  {ans.question?.question}
                </h5>
                
                {ans.question?.type === 'PROGRAMMING' ? (
                  <div className="ms-md-4 mt-3">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-dark">Select Language</label>
                      <select 
                        className="form-select bg-light border-light shadow-sm"
                        value={answers[ans.id]?.language || ''}
                        onChange={(e) => handleProgrammingChange(ans.id, 'language', e.target.value)}
                        style={{ maxWidth: '200px' }}
                      >
                        <option value="" disabled>Choose...</option>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label small fw-bold text-dark">Write your code here</label>
                      <textarea
                        className="form-control bg-light border-light shadow-sm"
                        rows="12"
                        placeholder="Write your code..."
                        value={answers[ans.id]?.code || ''}
                        onChange={(e) => handleProgrammingChange(ans.id, 'code', e.target.value)}
                        style={{ fontFamily: 'monospace', resize: 'vertical' }}
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3 ms-md-4 mt-3">
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey) => {
                      const optValue = ans.question[optKey];
                      const isSelected = answers[ans.id]?.selectedAnswer === optValue;
                      return (
                        <label 
                          key={optKey} 
                          className={`p-3 rounded border cursor-pointer d-flex align-items-center gap-3 transition-all ${isSelected ? 'border-primary bg-primary-subtle' : 'border-light bg-light hover-bg-gray'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input 
                            type="radio" 
                            name={`question_${ans.id}`}
                            value={optValue}
                            checked={isSelected}
                            onChange={() => handleOptionChange(ans.id, optValue)}
                            className="form-check-input mt-0 cursor-pointer shadow-none border-secondary"
                            style={{width: '20px', height: '20px'}}
                          />
                          <span className={`fw-medium ${isSelected ? 'text-primary' : 'text-dark'}`}>{optValue}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            <div className="d-flex justify-content-end mt-4">
              <button 
                className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm"
                onClick={handleSubmit}
                disabled={isPending || !isAllAnswered}
              >
                {isPending ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</>
                ) : (
                  'Submit Assessment'
                )}
              </button>
            </div>
            {!isAllAnswered && (
              <div className="text-end text-danger small mt-2 fw-medium">
                Please answer all questions before submitting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Confirm Submission" size="md">
        <div className="p-4">
          <p className="text-dark mb-4">Are you sure you want to submit your answers? You cannot change them later.</p>
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              className="btn btn-light border" 
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={confirmSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</>
              ) : (
                'Submit Assessment'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestTakingPage;
