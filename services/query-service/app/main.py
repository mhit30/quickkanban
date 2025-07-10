from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from gemini_client import gemini_client
import requests

model = SentenceTransformer("all-MiniLM-L6-v2")


class QueryRequest(BaseModel):
    query: str


app = FastAPI()

my_dict = {
    "UID100": "The lion is the king of the jungle",
    "UID101": "The caterpillar is a small insect that turns into a butterfly",
    "UID102": "The fox is a sly animal that lives in the woodlands.",
}


@app.post("/")
def query(req: QueryRequest):
    # Fetch the retrieve microservice for the mongo uids
    try:
        response = requests.post(
            "http://localhost:8002/", json={"query": req.query, "top_k": 2}
        )
        response = response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred {e}")

    context = []
    for indiv_context in response:
        context.append(my_dict[indiv_context["mongo_id"]])

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
