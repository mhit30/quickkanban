from faiss_index import FaissIndex
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import json


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 1


faiss_client = FaissIndex()
model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI()


@app.post("/")
def retrieve(req: RetrieveRequest):
    global model
    query = req.query
    top_k = req.top_k
    query_embedding = model.encode([query], normalize_embeddings=True)
    results = faiss_client.retrieve_nearest_k(query_embedding, top_k)
    return results
