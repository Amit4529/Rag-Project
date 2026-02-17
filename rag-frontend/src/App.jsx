import { useEffect, useState, useRef } from "react";
import { Send, Upload, File, FileText, Loader2, Sparkles } from "lucide-react";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const API = "https://amit0310-rag-project.hf.space";
  // const API = import.meta.env.VITE_API_URL;


  // Welcome animation on load
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // create session when page loads
  useEffect(() => {
    fetch(`${API}/session`)
      .then(res => res.json())
      .then(data => setSessionId(data.session_id));
  }, []);

  // upload pdf
  const handleUpload = async () => {
    if (!file) return alert("Select a PDF first");

    setUploading(true);
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("file", file);

    await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });

    setUploaded(true);
    setUploading(false);
    alert("PDF uploaded successfully!");
  };

  // ask question
  const handleAsk = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: userQuestion }]);
    setLoading(true);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("query", userQuestion);

    const res = await fetch(`${API}/ask`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    setMessages(prev => [...prev, { role: "bot", text: data.answer }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div style={styles.root}>
      {/* Animated Background */}
      <div style={styles.bgContainer}>
        <div style={styles.gradientBg}></div>
        <div style={styles.floatingOrb1}></div>
        <div style={styles.floatingOrb2}></div>
        <div style={styles.floatingOrb3}></div>
      </div>

      {/* Content */}
      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={{ ...styles.header, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? "translateY(0)" : "translateY(-20px)" }}>
          <div style={styles.headerContent}>
            <div style={styles.headerTop}>
              <Sparkles size={32} color="#ffffff" strokeWidth={1.5} />
              <h1 style={styles.title}>PDF Assistant</h1>
            </div>
            <p style={styles.subtitle}>Smart document analysis powered by AI</p>
          </div>
        </div>

        {/* Main Container */}
        <div style={styles.container}>
          {!uploaded ? (
            // Upload Section
            <div style={{ ...styles.uploadContainer, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? "scale(1)" : "scale(0.95)" }}>
              <div style={styles.uploadCard}>
                <div style={styles.uploadIconWrapper}>
                  <div style={styles.iconGlow}>
                    <Upload size={56} color="#ffffff" strokeWidth={1.5} />
                  </div>
                </div>
                
                <h2 style={styles.uploadTitle}>Upload Your PDF</h2>
                <p style={styles.uploadSubtitle}>
                  Select a PDF file to start asking questions
                </p>

                <label style={styles.fileInputLabel}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  <div style={styles.fileInputBox}>
                    <div style={styles.fileInputContent}>
                      {file ? (
                        <>
                          <File size={24} color="#3b82f6" />
                          <span style={styles.fileName}>{file.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} color="#3b82f6" />
                          <span style={styles.fileInputText}>Click to select PDF</span>
                          <span style={styles.dragHint}>or drag and drop</span>
                        </>
                      )}
                    </div>
                  </div>
                </label>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  style={{
                    ...styles.uploadButton,
                    opacity: !file || uploading ? 0.6 : 1,
                    cursor: !file || uploading ? "not-allowed" : "pointer"
                  }}
                >
                  {uploading ? (
                    <span style={styles.uploadingText}>Uploading...</span>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Upload PDF</span>
                    </>
                  )}
                </button>

                <p style={styles.infoText}>✓ Supports PDF files up to 100MB</p>
              </div>
            </div>
          ) : (
            // Chat Section - Centered Single Panel
            <div style={{ ...styles.chatContainerWrapper, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? "scale(1)" : "scale(0.95)" }}>
              <div style={styles.chatContainer}>
                {/* Chat Header */}
                <div style={styles.chatHeader}>
                  <div style={styles.chatHeaderLeft}>
                    <FileText size={22} color="#3b82f6" />
                    <div>
                      <h3 style={styles.chatTitle}>Document Q&A</h3>
                      <p style={styles.chatSubtitle}>{file?.name || "document.pdf"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploaded(false);
                      setFile(null);
                      setMessages([]);
                      setQuestion("");
                    }}
                    style={styles.newFileButton}
                  >
                    Upload New
                  </button>
                </div>

                {/* Messages */}
                <div style={styles.chatBox}>
                  {messages.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>
                        <FileText size={48} />
                      </div>
                      <p style={styles.emptyText}>
                        Ready to explore your document
                      </p>
                      <p style={styles.emptySubtext}>
                        Ask your first question to get started
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.messageBubble,
                          justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                          animation: `slideIn 0.3s ease ${index * 0.05}s both`
                        }}
                      >
                        <div
                          style={{
                            ...styles.messageContent,
                            ...(msg.role === "user" ? styles.userMessage : styles.botMessage)
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div style={styles.messageBubble}>
                      <div style={styles.loadingMessage}>
                        <div style={styles.typingIndicator}>
                          <span style={styles.dot}></span>
                          <span style={styles.dot}></span>
                          <span style={styles.dot}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Box */}
                <div style={styles.inputContainer}>
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask something about your PDF..."
                    disabled={loading}
                    style={styles.textarea}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!question.trim() || loading}
                    style={{
                      ...styles.sendButton,
                      opacity: !question.trim() || loading ? 0.6 : 1,
                      cursor: !question.trim() || loading ? "not-allowed" : "pointer"
                    }}
                  >
                    {loading ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(50px, -50px) rotate(120deg); }
          66% { transform: translate(-30px, 40px) rotate(240deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-60px, 40px) rotate(120deg); }
          66% { transform: translate(40px, -30px) rotate(240deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, 60px) rotate(120deg); }
          66% { transform: translate(-50px, -40px) rotate(240deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 10px 50px rgba(102, 126, 234, 0.6); }
        }
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.7; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
    overflow: "hidden"
  },
  bgContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 0,
    overflow: "hidden"
  },
  gradientBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
    backgroundSize: "400% 400%",
    animation: "gradientShift 15s ease infinite"
  },
  floatingOrb1: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    top: "-150px",
    right: "-150px",
    animation: "float1 20s ease-in-out infinite"
  },
  floatingOrb2: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
    borderRadius: "50%",
    bottom: "-120px",
    left: "-120px",
    animation: "float2 25s ease-in-out infinite"
  },
  floatingOrb3: {
    position: "absolute",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    top: "20%",
    right: "5%",
    animation: "float3 30s ease-in-out infinite"
  },
  contentWrapper: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%"
  },
  header: {
    color: "white",
    padding: "24px 20px",
    textAlign: "center",
    transition: "all 0.6s ease"
  },
  headerContent: {
    maxWidth: "100%",
    margin: "0 auto"
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "6px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    fontSize: "13px",
    margin: "0",
    opacity: 0.95,
    fontWeight: "400"
  },
  container: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    overflowY: "auto"
  },
  uploadContainer: {
    width: "100%",
    maxWidth: "500px",
    transition: "all 0.6s ease"
  },
  uploadCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "48px 32px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },
  uploadIconWrapper: {
    marginBottom: "24px",
    display: "flex",
    justifyContent: "center"
  },
  iconGlow: {
    width: "80px",
    height: "80px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
    animation: "pulse 2s ease-in-out infinite"
  },
  uploadTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "#1e293b"
  },
  uploadSubtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: "0 0 32px 0",
    lineHeight: "1.6"
  },
  fileInputLabel: {
    display: "block",
    marginBottom: "24px"
  },
  fileInputBox: {
    padding: "24px",
    border: "2px dashed #cbd5e1",
    borderRadius: "14px",
    cursor: "pointer",
    backgroundColor: "#f8fafc",
    transition: "all 0.3s ease",
    marginBottom: "24px"
  },
  fileInputContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    color: "#3b82f6"
  },
  fileName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    wordBreak: "break-word"
  },
  fileInputText: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#3b82f6"
  },
  dragHint: {
    fontSize: "13px",
    color: "#94a3b8"
  },
  uploadButton: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)"
  },
  uploadingText: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  infoText: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: "0"
  },
  chatContainerWrapper: {
    width: "100%",
    maxWidth: "800px",
    height: "100%",
    transition: "all 0.6s ease"
  },
  chatContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    border: "1px solid rgba(255, 255, 255, 0.3)"
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(226, 232, 240, 0.5)",
    backgroundColor: "rgba(248, 250, 252, 0.7)"
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  chatTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0",
    color: "#1e293b"
  },
  chatSubtitle: {
    fontSize: "12px",
    margin: "2px 0 0 0",
    color: "#94a3b8",
    fontWeight: "400"
  },
  newFileButton: {
    padding: "8px 14px",
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    color: "#3b82f6",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  chatBox: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#ffffff"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "16px"
  },
  emptyIcon: {
    width: "60px",
    height: "60px",
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#cbd5e1"
  },
  emptyText: {
    fontSize: "16px",
    margin: "0",
    color: "#1e293b",
    fontWeight: "600"
  },
  emptySubtext: {
    fontSize: "14px",
    margin: "0",
    color: "#94a3b8"
  },
  messageBubble: {
    display: "flex",
    marginBottom: "8px"
  },
  messageContent: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: "1.5",
    wordWrap: "break-word"
  },
  userMessage: {
    marginLeft: "auto",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    borderBottomRightRadius: "4px"
  },
  botMessage: {
    marginRight: "auto",
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    borderBottomLeftRadius: "4px"
  },
  loadingMessage: {
    marginRight: "auto",
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    padding: "12px 16px",
    borderRadius: "14px",
    borderBottomLeftRadius: "4px"
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    alignItems: "center"
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#cbd5e1",
    animation: "bounce 1.4s infinite"
  },
  inputContainer: {
    display: "flex",
    gap: "12px",
    padding: "16px 24px 24px",
    backgroundColor: "#ffffff"
  },
  textarea: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "none",
    maxHeight: "120px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#1e293b"
  },
  sendButton: {
    padding: "12px 16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  }
};

export default App;
