import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("POST /board", () => {
  it("should create a board", async () => {
    const res = await request(app)
      .post("/board")
      .send({ boardTitle: "Example Board" });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.board).toBeDefined();
  });
  it("should fail with missing title", async () => {
    const res = await request(app).post("/board").send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
  it("should fail with invalid data type title", async () => {
    const res = await request(app).post("/board").send({
      boardTitle: 123,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /board", () => {
  it("should get a board", async () => {
    const res = await request(app).get("/board/686b2a9ac71ef04a860bc70b");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.board).toBeDefined();
  });
  it("should fail because board not found", async () => {
    const res = await request(app).get("/board/686b2a9ac71ef04a860bc70c");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.board).toBeUndefined();
  });
  it("should fail because invalid board title", async () => {
    const res = await request(app).get("/board/123");
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT /board", () => {
  it("should update board title", async () => {
    const res = await request(app).put("/board/686b2a9ac71ef04a860bc70b").send({
      boardTitle: "Updated Title",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.board).toBeDefined();
  });
  it("should fail to update board with missing title", async () => {
    const res = await request(app)
      .put("/board/686b2a9ac71ef04a860bc70b")
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /board", () => {
  it("should delete a board", async () => {
    const res = await request(app).delete("/board/686b2a99f374a8ad4a9c4c24");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it("should fail to delete board with invalid ID", async () => {
    const res = await request(app).delete("/board/invalid-id");
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid board ID");
  });
});
