import uvicorn
from faiss_index import FaissIndex
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5


faiss_client = FaissIndex()
model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI()


@app.post("/")
def retrieve(req: RetrieveRequest):
    global model
    query = req.query
    top_k = req.top_k
    queryEmbedding = model.encode([query], normalize_embeddings=True)
    results = faiss_client.retrieve_nearest_k(queryEmbedding, top_k)
    return results
