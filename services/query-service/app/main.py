from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from gemini_client import gemini_client
from pymongo import MongoClient
import requests
from bson.objectid import ObjectId


model = SentenceTransformer("all-MiniLM-L6-v2")

client = MongoClient("localhost:27017")
db = client["quickkanban"]
collection = db["tasks"]


class QueryRequest(BaseModel):
    query: str


app = FastAPI()


@app.post("/")
def query(req: QueryRequest):
    try:
        response = requests.post(
            "http://localhost:8002/", json={"query": req.query, "top_k": 3}
        )
        response = response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred {e}")

    context = []
    try:
        for indiv_context in response:
            mongo_id = indiv_context["mongo_id"]
            # mongo_id = safe_objectid(mongo_id)
            context.append(
                collection.find_one(
                    {"_id": ObjectId(mongo_id)},
                    {"_id": 0, "columnId": 0, "boardId": 0, "user": 0},
                )
            )
    except Exception as e:
        print(f"An error occurred with MongoDB {e}")

    prompt = f"""
            Based only on the context, return the answer in this format:
                    
                    "summary": "...",
                    "source": "...",
                    "confidence": 0-1
                    
                    Context:
                    
                    {context}
                    
                    Question: {req.query}
                    Answer:
            """

    response = gemini_client.generate_content(prompt)
    return response.text
