import os
from fastapi import FastAPI
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from google import generativeai as genai
from google.generativeai import types


class RetrieveRequest(BaseModel):
    query: str
    boardId: str


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def get_embedding(text: str):
    result = genai.embed_content(
        model="models/embedding-001",
        content=text,
        task_type="SEMANTIC_SIMILARITY",
    )
    return result["embedding"]


qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant = QdrantClient(
    url="https://84b8fdb3-78c1-4995-975b-684ec7ec5566.us-west-2-0.aws.cloud.qdrant.io:6333",
    api_key=qdrant_api_key,
    prefer_grpc=False,
)

app = FastAPI()


@app.post("/")
def retrieve(req: RetrieveRequest):
    query_vector = get_embedding(req.query)
    results = qdrant.search(
        collection_name="boards_index",
        query_vector=query_vector,
        limit=3,
        with_payload=True,
        query_filter=Filter(
            must=[FieldCondition(key="boardId", match=MatchValue(value=req.boardId))]
        ),
    )

    task_ids = [hit.payload["taskId"] for hit in results if "taskId" in hit.payload]
    return {"taskIds": task_ids}
