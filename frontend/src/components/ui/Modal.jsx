import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, size = 'md', hideHeader = false, dialogStyle = {} }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}></div>
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={`modal-dialog modal-dialog-centered modal-${size}`} style={dialogStyle}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden fade-in-up" style={{ animationDuration: '0.3s' }}>
            {!hideHeader && (
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold tracking-tight text-dark">{title}</h5>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
              </div>
            )}
            <div className={`modal-body ${hideHeader ? 'p-0' : ''}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render the modal into the body to escape containing blocks (like backdrop-filter on the sidebar)
  return createPortal(modalContent, document.body);
};

export default Modal;
