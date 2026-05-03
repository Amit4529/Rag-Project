# 🧠 RAG-Based Intelligent Question Answering System

> Upload any PDF and ask questions — get accurate, context-aware answers powered by Retrieval-Augmented Generation.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![FAISS](https://img.shields.io/badge/VectorDB-FAISS-orange)

---

## 📌 Overview

This project implements a **Retrieval-Augmented Generation (RAG)** pipeline that grounds LLM responses in your actual documents — eliminating hallucinations and improving answer accuracy.

Instead of relying only on a language model's training data, this system:
- 📥 Ingests your PDF documents 
- 🔍 Retrieves the most relevant chunks using semantic search
- 🤖 Feeds context + query to Gemini LLM for accurate answers

---

## 🎯 Features

- 📄 **PDF Ingestion** — supports both text-based and scanned PDFs
- 🔍 **Semantic Search** — HuggingFace embeddings (all-MiniLM-L6-v2)
- ⚡ **Fast Retrieval** — FAISS vector database
- 🤖 **LLM-Powered Answers** — Gemini 2.5 Flash
- 🌐 **REST API** — FastAPI backend deployed on HuggingFace Spaces
- 🖥️ **React Frontend** — clean UI deployed on Vercel


---

## 🧠 How It Works

User Query
↓
Convert to Embedding (HuggingFace)
↓
Semantic Search in FAISS Vector DB
↓
Retrieve Top-K Relevant Chunks
↓
Pass Context + Query to Gemini LLM
↓
Generate Final Answer

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.10+ |
| Backend Framework | FastAPI |
| Embeddings | HuggingFace (all-MiniLM-L6-v2) |
| Vector Database | FAISS |
| LLM | Gemini 2.5 Flash |
| PDF Processing | pymupdf |
| Orchestration | LangChain |
| Frontend | React + Vite |
| Backend Hosting | HuggingFace Spaces |
| Frontend Hosting | Vercel |

----------------------------------------------------
