import os
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
from pymongo import MongoClient
import requests
from bson.objectid import ObjectId
from redis import asyncio as aioredis
import json
from fastapi.responses import StreamingResponse

r = aioredis.Redis(
    host=os.getenv("REDIS_HOST", "redis"), port=6379, db=0, decode_responses=True
)


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

gemini_client = genai.GenerativeModel("gemini-2.5-flash")

mongo_uri = os.getenv("MONGO_URI_PROD", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)
db = client["quickkanban"]
collection = db["tasks"]


class QueryRequest(BaseModel):
    query: str
    boardId: str
    sessionId: str


app = FastAPI()

retrieve_service = os.getenv("RETRIEVE_SERVICE_URL")


async def stream_assistant_chunks(stream):
    async for chunk in stream:
        if hasattr(chunk, "text"):
            yield chunk.text


@app.post("/")
async def query(req: QueryRequest):
    try:
        response = requests.post(
            retrieve_service,
            json={"query": req.query, "boardId": req.boardId},
        )
        response = response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred {e}")

    context = []
    try:
        for taskId in response["taskIds"]:
            context.append(
                collection.find_one(
                    {"_id": ObjectId(taskId)},
                    {"_id": 0, "columnId": 0, "boardId": 0, "user": 0},
                )
            )
    except Exception as e:
        print(f"An error occurred with MongoDB {e}")

    query_thread = {"user": [], "assistant": []}
    try:
        raw_user_data = await r.hget(req.sessionId, "user")
        raw_assistant_data = await r.hget(req.sessionId, "assistant")
        user_data = json.loads(raw_user_data or "[]")
        assistant_data = json.loads(raw_assistant_data or "[]")
        query_thread["user"] = user_data
        query_thread["assistant"] = assistant_data
    except Exception as e:
        print(f"An error occurred with Redis {e}")

    prompt = f""" 
                    You are a helpful assistant who helps users in a real-time, collaborative kanban board.
                    They need not know they are using a real-time, collaborative kanban board.
                    Users may ask you for logical next steps or how to implement something.
                    Provide detailed descriptions in your answers.
                    Provide your answers based only the context you are given, but you do have some room for freedom 
                    if and only if the user is asking you how to do something. 
                    If the user asks about how to do something, please provide a detailed 
                    of how to do it based on the context they are working in.
                 
                    You may use the conversation thread is gives you a history of the conversation between you and the user. 
                    This conversation thread is in a dictionary of user and assistant conversation where each array is indexed 
                    properly of user query and assistant response. 
                    If the user requests you to recall a previous moment in the conversation, use the conversation thread freely.
                    These are your output rules:
                        Never say anything you cannot do. These are things you can do: Provide assistance based on context and conversational thread only. 
                        These are things you cannot do: Say you can help them create tasks or any kind of database interaction (CRUD). 
                        Provide your answer in markdown format. If any code (e.g., commands, configurations, scripts) is useful or necessary, include them in proper fenced code blocks like this:

                        \`\`\`bash
                        your code here
                        \`\`\`

                        or

                      \`\`\`json
                        {{  
                        "example": true  
                        }}
                      \`\`\`
                    
                    Conversation Thread:
                    {query_thread}
                      
                    Context:
                    {context}

                    Question:
                    {req.query}

                    Answer in markdown:
            """
    stream = await gemini_client.generate_content(prompt, stream=True)
    return StreamingResponse(stream_assistant_chunks(stream), media_type="text/plain")
