import os
import requests

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
DATA_PATH = "data"

# -------- HF API EMBEDDINGS --------
def get_embedding(text):
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {"inputs": text}

    response = requests.post(url, headers=headers, json=payload, timeout=60)
    if response.status_code != 200:
        raise Exception(f"HF API Error: {response.text}")

    return response.json()[0]

class HFEmbeddings:
    def embed_documents(self, texts):
        return [get_embedding(t) for t in texts]

    def embed_query(self, text):
        return get_embedding(text)

# -------- LOAD PDFS --------
documents = []

for file in os.listdir(DATA_PATH):
    if file.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(DATA_PATH, file))
        documents.extend(loader.load())

print("Loaded pages:", len(documents))

# -------- SPLIT TEXT --------
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=150
)

chunks = text_splitter.split_documents(documents)
print("Total chunks:", len(chunks))

# -------- VECTOR STORE --------
embeddings = HFEmbeddings()
vectorstore = FAISS.from_documents([c.page_content for c in chunks], embeddings)
vectorstore.save_local("db")

print("✅ Knowledge stored in vector database (HF API)")
