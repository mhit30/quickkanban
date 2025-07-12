import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointIdsList

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant = QdrantClient(
    url="https://84b8fdb3-78c1-4995-975b-684ec7ec5566.us-west-2-0.aws.cloud.qdrant.io:6333",
    api_key=qdrant_api_key,
    prefer_grpc=False,
)


app = FastAPI()


class EmbedRequest(BaseModel):
    task: str
    taskId: str
    taskNumericId: int
    boardId: str


class UpdateRequest(BaseModel):
    task: str
    taskId: str
    taskNumericId: int
    boardId: str


def get_embedding(text: str):
    result = genai.embed_content(
        model="models/embedding-001",
        content=text,
        task_type="SEMANTIC_SIMILARITY",
    )
    return result["embedding"]


@app.post("/")
def embed(req: EmbedRequest):
    embedding = get_embedding(req.task)
    qdrant.upsert(
        collection_name="boards_index",
        points=[
            {
                "id": req.taskNumericId,
                "vector": embedding,
                "payload": {
                    "boardId": req.boardId,
                    "taskId": req.taskId,
                },
            }
        ],
    )
    return {"status": "embedded"}


@app.put("/")
def update(req: UpdateRequest):
    qdrant.delete(
        collection_name="boards_index",
        points_selector=PointIdsList(points=[req.taskNumericId]),
        wait=True,
    )
    embedding = get_embedding(req.task)
    qdrant.upsert(
        collection_name="boards_index",
        points=[
            {
                "id": req.taskNumericId,
                "vector": embedding,
                "payload": {
                    "boardId": req.boardId,
                    "taskId": req.taskId,
                },
            }
        ],
    )
    return {"status": "updated"}


@app.delete("/{taskNumericId}")
def delete(taskNumericId: int):
    qdrant.delete(
        collection_name="boards_index",
        points_selector=PointIdsList(points=[taskNumericId]),
        wait=False,
    )
    return {"status": "deleted"}
