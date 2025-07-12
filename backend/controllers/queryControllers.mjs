import mongoose from "mongoose";
import { Board, Column, Task } from "../models/Board.mjs";
import { QuerySchema } from "../validators/queryValidators.mjs";
import redis_client from "../services/redis-client.mjs";

const queryUrl = process.env.QUERY_SERVICE_URL || "http://query-service:8003";

// user queries {query in body} ->
// make a unique id for that query in redis;
// store the query in redis  -> query api

const query = async (req, res) => {
  const result = QuerySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  try {
    const redis = redis_client.getRedis();
    // construct a key based on boardID and the uid
    const key = `assistant:session:${result.data.boardId}:${result.data.uid}`;
    // get all the user queries from redis and add to that query set
    const userQueries = JSON.parse((await redis.hget(key, "user")) || "[]");
    userQueries.push(result.data.query);
    await redis.hset(key, "user", JSON.stringify(userQueries));
    await redis.hset(key, 3600); // convo thread expires after an hour
    //
    // prompt the query api
    const assistantRes = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: key,
        boardId: result.data.boardId,
        query: result.data.query,
      }),
    });

    if (!assistantRes.ok || !assistantRes.body) {
      return res.status(500).json({ success: false, error: "stream fail" });
    }
    res.setHeader("Content-Type", "text/plain");

    const reader = assistantRes.body.getReader();
    let assistantFullResponse = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      assistantFullResponse += chunk;
      // write back to client simultaneously
      res.write(chunk);
    }
    res.end();
    // get all the assistant responses, push new one, reset
    const assistantResponses = JSON.parse(
      (await redis.hget(key, "assistant")) || "[]"
    );
    assistantResponses.push(assistantFullResponse);
    await redis.hset(key, "assistant", JSON.stringify(assistantResponses));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const queryControllers = { query };

export default queryControllers;
