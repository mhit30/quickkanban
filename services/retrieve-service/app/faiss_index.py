import os
import numpy as np
import faiss
import redis

r = redis.Redis(host="localhost", port=6379, db=0)

DIM = 384


class FaissIndex:
    def __init__(self, index_name="index.faiss"):
        self.path = os.path.join(os.path.dirname(__file__), "../../data", index_name)
        self.index = faiss.read_index(self.path) if os.path.exists(self.path) else None
        if self.index == None:
            raise Exception("No faiss index found.")

    def retrieve_nearest_k(self, query_embedding: np.ndarray, top_k: int):
        D, I = self.index.search(query_embedding, top_k)
        # interact with Redis to send back the actual MongoID
        vector_ids = I[0]
        distance_scores = D[0]
        results = []
        for vector_id, distance_score in zip(vector_ids, distance_scores):
            results.append(
                {
                    "mongo_id": r.hget(
                        "faiss:vector_id_to_mongo_uid", str(vector_id)
                    ).decode("utf-8"),
                    "score": float(distance_score),
                }
            )
        return results
