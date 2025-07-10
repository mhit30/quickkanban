import os
import numpy as np
import faiss
import redis

r = redis.Redis(host="localhost", port=6379, db=0)
DIM = 384


class FaissIndex:
    def __init__(self, index_name="index.faiss"):
        self.path = os.path.join(os.path.dirname(__file__), "../../data", index_name)
        self.index = (
            faiss.read_index(self.path)
            if os.path.exists(self.path)
            else faiss.IndexIDMap(faiss.IndexFlatIP(384))
        )

    def save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        faiss.write_index(self.index, self.path)
        print(f"[FAISS] Saved index with {self.index.ntotal} vectors to {self.path}")

    def add_embedding_with_id(self, embedding: np.ndarray, taskId: str):
        vectorId = r.get("faiss:vector_id_counter")
        if not vectorId:
            r.set("faiss:vector_id_counter", 1)
            r.hset("faiss:vector_id_to_mongo_uid", 1, taskId)
            vectorId = 1
        else:
            vectorId = r.incr("faiss:vector_id_counter")
            r.hset("faiss:vector_id_to_mongo_uid", vectorId, taskId)

        vectorId = np.array([vectorId])
        self.index.add_with_ids(embedding, vectorId)
        self.save()
