import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiTrash2 } from 'react-icons/fi';
import { deleteNoteHistory, getNoteHistory } from '../utils/noteHistory';
import './HistoryPage.css';

const HistoryPage = ({ onBack }) => {
  const [history, setHistory] = useState(() => getNoteHistory());
  const [loading] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      deleteNoteHistory(noteToDelete.id);
      setHistory(prev => prev.filter(note => note.id !== noteToDelete.id));
      
      setToastMessage({ type: 'success', text: 'Summary deleted successfully.' });
      setTimeout(() => setToastMessage(null), 3000);
      
      setDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting summary:", error);
      setToastMessage({ type: 'error', text: 'Failed to delete summary.' });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedNote) {
    return (
      <div className="history-page">
        <div className="history-header-actions">
          <button className="action-btn" onClick={() => setSelectedNote(null)}>
            ← Back to History
          </button>
          <h2>{selectedNote.fileName}</h2>
        </div>
        <div className="notes-container history-notes-container">
          <div className="notes-content">
            <ReactMarkdown>{selectedNote.notes}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {toastMessage && (
        <div className={`toast-notification toast-${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}

      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Summary</h3>
            <p>
              Are you sure you want to delete <br/>
              <strong>"{noteToDelete?.fileName}"</strong>?
            </p>
            <p className="modal-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <span className="loader-small"></span> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="history-header-actions">
        <h2>Your Notes History </h2>
        <button className="btn-primary generate-new-btn" onClick={onBack}>
          Generate New +
        </button>
      </div>

      {loading ? (
        <div className="loading-container history-loading">
          <span className="loader"></span>
          <div className="loading-text">Loading your history...</div>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <h3>No notes yet</h3>
          <p>Upload your first PDF to get started!</p>
          <button className="btn-primary" onClick={onBack}>Upload PDF</button>
        </div>
      ) : (
        <div className="history-grid">
          {history.map((note) => (
            <div key={note.id} className="history-card">
              <div className="history-card-icon">📄</div>
              <div className="history-card-content">
                <div className="history-card-title-row">
                  <h3 className="history-card-title">{note.fileName}</h3>
                  <button 
                    className="delete-icon-btn" 
                    onClick={() => handleDeleteClick(note)}
                    title="Delete Summary"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <p className="history-card-date">{formatDate(note.createdAt)}</p>
              </div>
              <button 
                className="btn-secondary view-notes-btn" 
                onClick={() => setSelectedNote(note)}
              >
                View Notes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
