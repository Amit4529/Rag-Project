from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid

# loaders
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# vector store
from langchain_community.vectorstores import FAISS

# embeddings
from langchain_huggingface import HuggingFaceEmbeddings

# LLM
from langchain_google_genai import ChatGoogleGenerativeAI

app = FastAPI()

# allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#API
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# store sessions in RAM (temporary)
sessions = {}

# embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# llm
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

# ---------------- CREATE SESSION ----------------
@app.get("/session")
def create_session():
    session_id = str(uuid.uuid4())
    sessions[session_id] = None
    return {"session_id": session_id}


# ---------------- UPLOAD PDF ----------------
@app.post("/upload")
async def upload_pdf(session_id: str = Form(...), file: UploadFile = File(...)):

    file_path = f"temp_{session_id}.pdf"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    loader = PyPDFLoader(file_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(docs)

    vector_db = FAISS.from_documents(chunks, embeddings)

    sessions[session_id] = vector_db

    return {"message": "PDF processed successfully"}


# ---------------- ASK QUESTION ----------------
@app.post("/ask")
async def ask_question(session_id: str = Form(...), query: str = Form(...)):

    if session_id not in sessions or sessions[session_id] is None:
        return {"answer": "Upload a PDF first"}

    vector_db = sessions[session_id]

    retriever = vector_db.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(query)

    context = "\n\n".join([d.page_content for d in docs])

    prompt = f"""
You are a helpful AI assistant.
Answer ONLY from the given context.
If answer is not present, say: Not in document.

Context:
{context}

Question:
{query}
"""

    from fastapi import HTTPException

    try:
        response = llm.invoke(prompt)
        answer = response.content
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Model busy or quota exceeded. Please try again later."
        )

    return {"answer": answer}