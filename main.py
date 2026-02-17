from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid
import requests
from dotenv import load_dotenv

# Load API keys
load_dotenv()
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# LangChain loaders & vectorstore
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

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

# store sessions in RAM
sessions = {}

# LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

# ---------------- HF API Embeddings ----------------
def get_embeddings(texts):
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {"inputs": texts}
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="HF API Error")
    return response.json()

# ---------------- CREATE SESSION ----------------
@app.get("/session")
def create_session():
    session_id = str(uuid.uuid4())
    sessions[session_id] = None
    return {"session_id": session_id}

# ---------------- UPLOAD PDF ----------------
# @app.post("/upload")
# async def upload_pdf(session_id: str = Form(...), file: UploadFile = File(...)):

#     file_path = f"temp_{session_id}.pdf"
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     loader = PyPDFLoader(file_path)
#     docs = loader.load()

#     splitter = RecursiveCharacterTextSplitter(
#         chunk_size=900,
#         chunk_overlap=200
#     )
#     chunks = splitter.split_documents(docs)

#     # Compute embeddings via HF API
#     embeddings_list = [get_embeddings(d.page_content)[0] for d in chunks]

#     vector_db = FAISS.from_texts([d.page_content for d in chunks], embeddings_list)

#     sessions[session_id] = vector_db

#     # Clean up PDF
#     os.remove(file_path)

#     return {"message": "PDF processed successfully"}
@app.post("/upload")
async def upload_pdf(session_id: str = Form(...), file: UploadFile = File(...)):
    try:
        # ✅ Use Render-safe temp directory
        file_path = f"/tmp/temp_{session_id}.pdf"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        loader = PyPDFLoader(file_path)
        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=200
        )
        chunks = splitter.split_documents(docs)

        # ✅ Batch HF embeddings instead of per chunk (prevents crash)
        texts = [d.page_content for d in chunks]
        embeddings_vectors = get_embeddings(texts)

        # ✅ Proper FAISS construction
        vector_db = FAISS.from_embeddings(
            text_embeddings=list(zip(texts, embeddings_vectors)),
            embedding=None
        )

        sessions[session_id] = vector_db

        os.remove(file_path)

        return {"message": "PDF processed successfully"}

    except Exception as e:
        print("❌ UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


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

    try:
        response = llm.invoke(prompt)
        answer = response.content
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Model busy or quota exceeded. Please try again later."
        )

    return {"answer": answer}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)