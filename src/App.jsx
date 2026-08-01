import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { FiUploadCloud, FiCopy, FiDownload, FiCheck, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import HistoryPage from './pages/HistoryPage';
import QuestionsPage from './pages/QuestionsPage';
import { db } from './firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './index.css';
import Loader from './components/Loader';
import DownloadSwitch from './components/DownloadSwitch';

function App() {
  const { currentUser, loginWithGoogle, loginWithPhone, logout } = useAuth();
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

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = async (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setError('');
    generateNotes(selectedFile);
  };

  const generateNotes = async (selectedFile) => {
    if (loading) return; // Prevent duplicate API calls
    setLoading(true);
    setNotes('');
    setError('');

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('uid', currentUser.uid);

    try {
      const response = await axios.post('/api/generate-notes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setNotes(response.data.notes);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 429) {
        setError('Daily free-tier limit reached (20 requests/day). Try again tomorrow or use a different API key.');
      } else {
        setError(err.response?.data?.error || 'Failed to generate notes. Please make sure the backend is running.');
      }
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
    const element = notesRef.current;
    const opt = {
      margin: 0.5,
      filename: 'Study_Notes.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!currentUser) {
    return (
      <LandingPage
        loginWithGoogle={loginWithGoogle}
        loginWithPhone={loginWithPhone || (() => alert('Phone login coming soon'))}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="header" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {currentUser.photoURL && (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span style={{ fontSize: '0.9rem', color: '#666' }}>{currentUser.displayName || currentUser.email}</span>
              <button onClick={() => { setShowHistory(true); setShowQuestionsPage(false); }} className="action-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>History</button>
              <button onClick={logout} className="action-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Logout</button>
            </div>
          )}
        </div>
        <h1>NoteGem</h1>
        <p>Transform your college PDFs into beautifully structured study notes in seconds.</p>
      </header>

      {showHistory ? (
        <HistoryPage onBack={() => setShowHistory(false)} />
      ) : showQuestionsPage ? (
        <QuestionsPage 
          file={file} 
          onBack={() => setShowQuestionsPage(false)} 
          questions={questions}
          setQuestions={setQuestions}
          questionsFileRef={questionsFileRef}
        />
      ) : (
        <main className="main-content">
          {!notes && !loading && (
            <div
              className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
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
                <button className="action-btn" onClick={copyToClipboard}>
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? 'Copied!' : 'Copy Notes'}
                </button>
                <DownloadSwitch onDownload={downloadPDF} />
                <button className="action-btn" onClick={() => setShowQuestionsPage(true)}>
                  <FiHelpCircle />
                  Questions
                </button>
                <button className="action-btn" onClick={() => { 
                  setNotes(''); 
                  setFile(null); 
                  setQuestions('');
                  questionsFileRef.current = null;
                }}>
                  <FiUploadCloud />
                  Upload Another
                </button>
              </div>
              <div className="notes-content" ref={notesRef}>
                <ReactMarkdown>{notes}</ReactMarkdown>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
