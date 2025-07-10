from faiss_index import FaissIndex
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")


class EmbedRequest(BaseModel):
    task: str
    taskId: str


faiss_client = FaissIndex()
app = FastAPI()


@app.post("/")
def embed(req: EmbedRequest):
    global model
    task = req.task
    taskId = req.taskId
    embedding = model.encode([task], normalize_embeddings=True)
    faiss_client.add_embedding_with_id(embedding, taskId)
