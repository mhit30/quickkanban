import os
from fastapi import FastAPI
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointIdsList
from google import genai
from google.genai.types import EmbedContentConfig


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant = QdrantClient(
    url="https://84b8fdb3-78c1-4995-975b-684ec7ec5566.us-west-2-0.aws.cloud.qdrant.io:6333",
    api_key=qdrant_api_key,
    prefer_grpc=False,
    check_compatibility=False,
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
    result = client.models.embed_content(
        model="models/embedding-001",
        contents=text,
        config=EmbedContentConfig(task_type="SEMANTIC_SIMILARITY"),
    )
    return result.embeddings[0].values


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
