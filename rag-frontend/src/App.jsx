import { useEffect, useState, useRef, useCallback } from "react";
import {
  Send,
  Upload,
  FileText,
  Loader2,
  ArrowDown,
  Zap,
  Search,
  Shield,
  Check,
  X,
  Plus,
  MessageSquare,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";
import "./App.css";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toasts, setToasts] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API = "https://amit0310-rag-project.hf.space";

  // ─── Toast system ───
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  // ─── Scroll to bottom ───
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Create session on load ───
  useEffect(() => {
    fetch(`${API}/session`)
      .then((res) => res.json())
      .then((data) => setSessionId(data.session_id));
  }, []);

  // ─── Upload PDF ───
  const handleUpload = async () => {
    if (!file) {
      showToast("Select a PDF first", "warning");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("file", file);

    try {
      await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });
      setUploaded(true);
      setUploading(false);
      showToast("PDF uploaded and analyzed successfully!", "success");
    } catch {
      setUploading(false);
      showToast("Upload failed. Please try again.", "error");
    }
  };

  // ─── Ask question ───
  const handleAsk = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: userQuestion }]);
    setLoading(true);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("query", userQuestion);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // ─── Drag and drop ───
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        showToast("Only PDF files are supported", "warning");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleSuggestionClick = (text) => {
    setQuestion(text);
  };

  const handleNewDocument = () => {
    setUploaded(false);
    setFile(null);
    setMessages([]);
    setQuestion("");
  };

  return (
    <div className="app">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--1" />
        <div className="ambient-orb ambient-orb--2" />
        <div className="ambient-orb ambient-orb--3" />
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast--${toast.type}${toast.exiting ? " toast--exiting" : ""}`}
            >
              {toast.type === "success" && <Check size={16} />}
              {toast.type === "error" && <X size={16} />}
              {toast.type === "warning" && <Zap size={16} />}
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo">
            <BrainCircuit size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="header__title">AskNeura</h1>
            <p className="header__subtitle">Intelligent PDF Chat</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        {!uploaded ? (
          /* ═══ Upload Screen ═══ */
          <div className="upload-section">
            <div className="upload-card">
              <div className="upload-card__icon-wrap">
                <Upload size={28} color="var(--accent)" strokeWidth={1.5} />
              </div>

              <h2 className="upload-card__title">Upload Your PDF</h2>
              <p className="upload-card__desc">
                Select a PDF file to start asking questions
              </p>

              {/* Drop zone */}
              <label
                className={`drop-zone${dragActive ? " drop-zone--active" : ""}${file ? " drop-zone--has-file" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
                <div className="drop-zone__content">
                  {file ? (
                    <div className="file-preview">
                      <FileText size={22} color="var(--accent)" />
                      <div>
                        <div className="file-preview__name">{file.name}</div>
                        <div className="file-preview__size">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ArrowDown
                        size={24}
                        className="drop-zone__icon"
                        strokeWidth={1.5}
                      />
                      <span className="drop-zone__text">
                        Click to select PDF
                      </span>
                      <span className="drop-zone__hint">or drag and drop</span>
                    </>
                  )}
                </div>
              </label>

              {/* Info */}
              <p className="upload-info">
                <Check size={14} className="upload-info__check" />
                Supports PDF files up to 100MB
              </p>

              {/* Upload button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="upload-btn"
                aria-label="Analyze PDF"
                style={{ marginTop: "16px" }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="upload-btn__spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze PDF
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Feature badges */}
            <div className="features">
              <div className="feature">
                <div className="feature__icon feature__icon--analysis">
                  <Zap size={18} />
                </div>
                <span className="feature__label">Instant Analysis</span>
              </div>
              <div className="feature">
                <div className="feature__icon feature__icon--search">
                  <Search size={18} />
                </div>
                <span className="feature__label">Deep Search</span>
              </div>
              <div className="feature">
                <div className="feature__icon feature__icon--secure">
                  <Shield size={18} />
                </div>
                <span className="feature__label">Secure</span>
              </div>
            </div>
          </div>
        ) : (
          /* ═══ Chat Screen ═══ */
          <div className="chat-section">
            <div className="chat-panel">
              {/* Chat header */}
              <div className="chat-header">
                <div className="chat-header__left">
                  <div className="chat-header__doc-icon">
                    <FileText size={18} />
                  </div>
                  <div className="chat-header__info">
                    <h3>Document Q&A</h3>
                    <p>{file?.name || "document.pdf"}</p>
                  </div>
                </div>
                <button
                  onClick={handleNewDocument}
                  className="chat-header__new-btn"
                >
                  <Plus size={14} />
                  New Document
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty__icon">
                      <MessageSquare size={32} />
                    </div>
                    <p className="chat-empty__title">
                      Ready to explore your document
                    </p>
                    <p className="chat-empty__desc">
                      Ask your first question to get started
                    </p>
                    <div className="chat-empty__suggestions">
                      <button
                        className="suggestion-chip"
                        onClick={() =>
                          handleSuggestionClick(
                            "What is this document about?"
                          )
                        }
                      >
                        What is this document about?
                      </button>
                      <button
                        className="suggestion-chip"
                        onClick={() =>
                          handleSuggestionClick("Summarize the key points")
                        }
                      >
                        Summarize the key points
                      </button>
                      <button
                        className="suggestion-chip"
                        onClick={() =>
                          handleSuggestionClick(
                            "What are the main conclusions?"
                          )
                        }
                      >
                        What are the main conclusions?
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message message--${msg.role === "user" ? "user" : "bot"}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div
                        className={`message__bubble message__bubble--${msg.role === "user" ? "user" : "bot"}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask something about your PDF..."
                  disabled={loading}
                  className="chat-input__textarea"
                  rows={1}
                  aria-label="Ask a question"
                />
                <button
                  onClick={handleAsk}
                  disabled={!question.trim() || loading}
                  className="chat-input__send"
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 size={18} className="upload-btn__spinner" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              <div className="chat-input__hint">
                Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for
                new line
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
