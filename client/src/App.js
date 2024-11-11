// src/App.js

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const socket = io('http://localhost:4000'); // Connect to backend server

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState('pdf');
  const defaultLayout = defaultLayoutPlugin();

  useEffect(() => {
    socket.on('pageChange', (page) => {
      setCurrentPage(page);
    });

    socket.on('connect', () => {
      socket.emit('checkAdmin');
    });

    socket.on('adminStatus', (status) => {
      setIsAdmin(status);
    });

    return () => {
      socket.off('pageChange');
      socket.off('adminStatus');
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.split('/')[0];
      setFileType(fileType);

      if (fileType === 'application' && file.type === 'application/pdf') {
        const fileUrl = URL.createObjectURL(file);
        setFileUrl(fileUrl);
      } else {
        setFileUrl(null);
      }
    }
  };

  const emitPageChange = (newPage) => {
    setCurrentPage(newPage);
    socket.emit('pageChange', newPage);
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.header}>
        <h1 style={styles.title}>PDF Co-Viewer Portal</h1>
        <p style={styles.statusText}>
          {isAdmin ? "You're the Admin" : "Admin controls the page movement"}
        </p>
      </div>

      <div style={styles.fileInputContainer}>
        <input type="file" onChange={handleFileChange} style={styles.fileInput} />
      </div>

      <div style={styles.viewerContainer}>
        {fileType === 'application' && fileUrl && (
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[defaultLayout]}
              initialPage={currentPage - 1}
              onPageChange={(e) => {
                setCurrentPage(e.currentPage);
                if (isAdmin) {
                  emitPageChange(e.currentPage);
                }
              }}
            />
          </Worker>
        )}
      </div>

      {isAdmin && fileType === 'application' && fileUrl && (
        <div style={styles.controls}>
          <button
            style={styles.button}
            onClick={() => emitPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous Page
          </button>
          <button style={styles.button} onClick={() => emitPageChange(currentPage + 1)}>
            Next Page
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    width: '100%',
    padding: '1.5rem 0',
    backgroundColor: '#4a90e2',
    color: '#ffffff',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: '1.1rem',
    fontWeight: '400',
    marginTop: '0.5rem',
  },
  fileInputContainer: {
    margin: '2rem 0 1rem',
    textAlign: 'center',
  },
  fileInput: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  viewerContainer: {
    flex: 1,
    width: '90%',
    maxWidth: '800px',
    height: '70vh',
    marginTop: '1rem',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4a90e2',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default App;
