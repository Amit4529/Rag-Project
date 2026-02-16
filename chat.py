from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
import os

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Embeddings (same as ingest.py)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

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
    return list(set(queries))  # remove duplicates


# -------- CHAT LOOP --------
while True:
    query = input("\nAsk: ")

    # Step 1: generate better queries
    search_queries = generate_search_queries(query)
    print("\nSearching for:", search_queries)

    # Step 2: retrieve docs from all queries
    all_docs = []
    for q in search_queries:
        docs = retriever.invoke(q)
        all_docs.extend(docs)

    # Step 3: remove duplicate chunks
    unique_docs = list({d.page_content: d for d in all_docs}.values())

    # Step 4: create context
    context = "\n\n".join([d.page_content for d in unique_docs[:8]])

    # Step 5: grounded answering
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