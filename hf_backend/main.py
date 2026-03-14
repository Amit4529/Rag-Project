from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid

# loaders
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# vector store
from langchain_community.vectorstores import FAISS

# LOCAL embeddings (no API anymore)
from langchain_huggingface import HuggingFaceEmbeddings

# LLM
from langchain_google_genai import ChatGoogleGenerativeAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# sessions in RAM
sessions = {}

embeddings = None

def get_embeddings():
    global embeddings
    if embeddings is None:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return embeddings

# Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

# ---------- SESSION ----------
@app.get("/session")
def create_session():
    session_id = str(uuid.uuid4())
    sessions[session_id] = None
    return {"session_id": session_id}

# ---------- UPLOAD ----------
@app.post("/upload")
async def upload_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    try:
        file_path = f"/tmp/{session_id}.pdf"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        loader = PyPDFLoader(file_path)
        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=200
        )
        chunks = splitter.split_documents(docs)

        # Local embeddings → FAISS
        # vector_db = FAISS.from_documents(chunks, embeddings)
        vector_db = FAISS.from_documents(chunks, get_embeddings())

        sessions[session_id] = vector_db
        os.remove(file_path)

        return {"message": "PDF processed successfully"}

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ---------- ASK ----------
@app.post("/ask")
async def ask_question(session_id: str = Form(...), query: str = Form(...)):

    if session_id not in sessions or sessions[session_id] is None:
        return {"answer": "Upload a PDF first"}

    vector_db = sessions[session_id]
    retriever = vector_db.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(query)

    context = "\n\n".join([d.page_content for d in docs])

    prompt = f"""
Answer ONLY from context.
If not found say: Not in document.

Context:
{context}

Question:
{query}
"""

    try:
        response = llm.invoke(prompt)
        return {"answer": response.content}
    except Exception:
        raise HTTPException(status_code=503, detail="Model busy")