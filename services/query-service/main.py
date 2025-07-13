import os
from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
import requests
from bson.objectid import ObjectId
from redis import asyncio as aioredis
import json
from fastapi.responses import StreamingResponse
from google import genai


r = aioredis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    password=os.getenv("REDIS_PASS"),
    db=0,
    decode_responses=True,
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

mongo_uri = os.getenv("MONGO_URI_PROD")
mongo_client = MongoClient(mongo_uri)
db = mongo_client["test"]
collection = db["tasks"]


class QueryRequest(BaseModel):
    query: str
    boardId: str
    sessionId: str


app = FastAPI()

retrieve_service = os.getenv("RETRIEVE_SERVICE_URL")


def stream_assistant_chunks(stream):
    for chunk in stream:
        if hasattr(chunk, "text"):
            print(chunk.text)
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
                    {
                        "_id": 0,
                        "columnId": 0,
                        "boardId": 0,
                        "user": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                    },
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
                        Never output raw data of what you have been given. Do not output task ids. 
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
    stream = client.models.generate_content_stream(
        model="gemini-2.5-flash", contents=prompt
    )
    return StreamingResponse(stream_assistant_chunks(stream), media_type="text/plain")
