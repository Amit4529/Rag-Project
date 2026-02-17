from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import requests

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# -------- HF API EMBEDDINGS FUNCTION --------
def get_embedding(text):
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {"inputs": text}

    response = requests.post(url, headers=headers, json=payload, timeout=60)

    if response.status_code != 200:
        raise Exception(f"HF API Error: {response.text}")

    return response.json()[0]   # vector

# -------- FAISS EMBEDDING WRAPPER --------
class HFEmbeddings:
    def embed_query(self, text):
        return get_embedding(text)

    def embed_documents(self, texts):
        return [get_embedding(t) for t in texts]

embeddings = HFEmbeddings()

# Load DB
db = FAISS.load_local("db", embeddings, allow_dangerous_deserialization=True)
retriever = db.as_retriever(search_kwargs={"k": 4})

# Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

# -------- QUERY REWRITER FUNCTION --------
def generate_search_queries(question):
    rewrite_prompt = f"""
You are a search query generator for a document retrieval system.

Rewrite the user question into 5 different search queries
that could appear inside a document.

Keep them short and keyword focused.
Return only the list.

Question: {question}
"""
    response = llm.invoke(rewrite_prompt).content
    queries = [q.strip("-•1234567890. ") for q in response.split("\n") if q.strip()]
    return list(set(queries))

# -------- CHAT LOOP --------
while True:
    query = input("\nAsk: ")

    search_queries = generate_search_queries(query)
    print("\nSearching for:", search_queries)

    all_docs = []
    for q in search_queries:
        docs = retriever.invoke(q)
        all_docs.extend(docs)

    unique_docs = list({d.page_content: d for d in all_docs}.values())
    context = "\n\n".join([d.page_content for d in unique_docs[:8]])

    final_prompt = f"""
You are a document assistant.

Answer ONLY using the provided context.
If answer is not present, say: Not in document.

Context:
{context}

Question:
{query}
"""

    response = llm.invoke(final_prompt)
    print("\nAnswer:", response.content)
