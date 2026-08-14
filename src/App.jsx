import React, { useRef, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { FiUploadCloud, FiCopy, FiCheck, FiHelpCircle } from 'react-icons/fi';
import HistoryPage from './pages/HistoryPage';
import QuestionsPage from './pages/QuestionsPage';
import { saveNoteHistory } from './utils/noteHistory';
import './index.css';
import Loader from './components/Loader';
import DownloadSwitch from './components/DownloadSwitch';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const [showQuestionsPage, setShowQuestionsPage] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const notesRef = useRef(null);
  const [questions, setQuestions] = useState('');
  const questionsFileRef = useRef(null);

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileSelection(event.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      handleFileSelection(event.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setError('');
    generateNotes(selectedFile);
  };

  const generateNotes = async (selectedFile) => {
    if (loading) return;
    setLoading(true);
    setNotes('');
    setError('');

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await axios.post('/api/generate-notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNotes(response.data.notes);
      saveNoteHistory({ fileName: selectedFile.name, notes: response.data.notes });
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.response?.status === 429
          ? 'Daily free-tier limit reached (20 requests/day). Try again tomorrow or use a different API key.'
          : requestError.response?.data?.error || 'Failed to generate notes. Please make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    html2pdf().set({
      margin: 0.5,
      filename: 'Study_Notes.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(notesRef.current).save();
  };

  return (
    <div className="app-container">
      <header className="header" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <button onClick={() => { setShowHistory(true); setShowQuestionsPage(false); }} className="action-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>History</button>
        </div>
        <h1>NoteGem</h1>
        <p>Transform your college PDFs into beautifully structured study notes in seconds.</p>
      </header>

      {showHistory ? (
        <HistoryPage onBack={() => setShowHistory(false)} />
      ) : showQuestionsPage ? (
        <QuestionsPage file={file} onBack={() => setShowQuestionsPage(false)} questions={questions} setQuestions={setQuestions} questionsFileRef={questionsFileRef} />
      ) : (
        <main className="main-content">
          {!notes && !loading && (
            <div className={`upload-zone ${isDragActive ? 'drag-active' : ''}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current.click()}>
              <input type="file" accept=".pdf" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
              <FiUploadCloud className="upload-icon" />
              <h2 className="upload-text">Click or drag & drop your PDF here</h2>
              <p className="upload-subtext">Maximum file size: 10MB</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {loading && (
            <div className="loading-container">
              <Loader />
              <div className="loading-text">Analyzing your document and crafting notes...</div>
            </div>
          )}

          {notes && !loading && (
            <div className="notes-container">
              <div className="notes-actions">
                <button className="action-btn" onClick={copyToClipboard}>{copied ? <FiCheck /> : <FiCopy />}{copied ? 'Copied!' : 'Copy Notes'}</button>
                <DownloadSwitch onDownload={downloadPDF} />
                <button className="action-btn" onClick={() => setShowQuestionsPage(true)}><FiHelpCircle />Questions</button>
                <button className="action-btn" onClick={() => { setNotes(''); setFile(null); setQuestions(''); questionsFileRef.current = null; }}><FiUploadCloud />Upload Another</button>
              </div>
              <div className="notes-content" ref={notesRef}><ReactMarkdown>{notes}</ReactMarkdown></div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
