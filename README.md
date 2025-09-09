# 👨‍💻👩‍💻 QuickKanban

<div align="center">
  <img src="./frontend/public/quickkanbanlogo.svg" width="40%" alt="QuickKanban logo"/>
</div>

**QuickKanban** is a real-time, collaborative kanban board with an AI Copilot assistant for intelligent task tracking, built for efficient project planning and team coordination.

---

## 🚀 Tech Stack

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=for-the-badge)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?logo=google&logoColor=white&style=for-the-badge)](https://deepmind.google/technologies/gemini/)
[![Qdrant](https://img.shields.io/badge/Qdrant-3A6AFF?logo=data&logoColor=white&style=for-the-badge)](https://qdrant.tech/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white&style=for-the-badge)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4ea94b?logo=mongodb&logoColor=white&style=for-the-badge)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-404D59?logo=express&style=for-the-badge)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-black?logo=socket.io&style=for-the-badge)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=for-the-badge)](https://www.docker.com/)
[![Amazon ECS](https://img.shields.io/badge/AWS%20ECS-FF9900?logo=amazon-ecs&logoColor=white&style=for-the-badge)](https://aws.amazon.com/ecs/)
[![Amazon EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?logo=amazon-ec2&logoColor=white&style=for-the-badge)](https://aws.amazon.com/ec2/)
[![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb&style=for-the-badge)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![Chakra UI](https://img.shields.io/badge/Chakra%20UI-319795?logo=chakraui&logoColor=white&style=for-the-badge)](https://chakra-ui.com/)
[![Amazon ECR](https://img.shields.io/badge/AWS%20ECR-FF9900?logo=amazon&logoColor=white&style=for-the-badge)](https://aws.amazon.com/ecr/)

## AI Copilot (LLM Integration)

QuickKanban includes a real-time **AI Copilot** that delivers task insights
as your board updates using a Retrieval-Augmented-Generation (RAG) pipeline. All queries first go through the Express.js backend API.

- Embeds task updates using **Gemini** LLM embeddings
- Stores and retrieves vectors with **Qdrant**
- AI summaries, suggestions, and insights are **streamed to user within ~500ms**
- A **contextual thread** is maintained between Gemini and user using **Redis**
- **Gemini and Qdrant** interactions are served through dedicated **FastAPI microservices**

As users add more tasks, the AI Copilot can provide deeper insights for the expanding board - enabling dynamic reasoning and memory.

## Features

- ⚡ **Real-time updates** using WebSockets (Socket.IO)
- 🤖 **AI Copilot Assistant** that summarizes and reasons about tasks in real time
- 🧠 **RAG-based vector search** powered by Gemini + Qdrant
- 🧵 **LLM memory and thread context** via Redis
- 👥 **Live user presence tracking** in collaborative kanban rooms
- 🖱️ **Live cursor indicators** to show teammates' movements in real-time
- 📌 Add tasks fluidly to boards; drag-and-drop with column transitions
- 💾 Persistent task storage with MongoDB

## System Architecture

- **Frontend**: React + Socket.IO for live collaboration and presence
- **Main API**: Node.js + Express + WebSockets
- **AI Microservices**: FastAPI-based embedder, retriever, and query services
- **Gemini + Qdrant**: RAG backend with embeddings + vector search
- **Redis**: Stores temporary conversational thread between the LLM and user and serves as a general cache for board
- **MongoDB**: Durable task + board storage

---

## Setup & Deployment

QuickKanban is fully containerized and deployed using AWS.

### Containerization

- Each service (backend, AI microservices, Redis, Nginx) runs in its own Docker container
- Containers are managed using ECS with EC2 launch type

### AWS Deployment

- **Amazon ECS (EC2 Launch Type):** Orchestrates microservices
- **Amazon EC2:** Hosts all running containers and mounts SSL certs
- **Amazon ECR:** Stores Docker images
- **Nginx:** Handles HTTPS and reverse proxies to backend

## Deployment files:

- `ecs-task-definition.json`
- `nginx.conf`
- `Dockerfile` (for both backend and Nginx)

---

## 🤝 Contributing

Please feel free to contribute! This is a fun, ambitious project with lots of room to grow.

### 🛠️ Local Development Setup

1. **Fork** this repository
2. Clone your fork:

```bash
git clone https://github.com/mhit30/quickkanban.git
```

Note: Make sure Qdrant, MongoDB, Redis running on your system. Also
obtain a Gemini API Key from Google GenAI to connect to Gemini.

```bash
 cd backend && npm install
```

```bash
 cd frontend && npm install
```

For backend (with Nodemon):

```bash
  nodemon index.js
```

For frontend (with React Vite)

```bash
  npm run dev
```

### 🔄 Making PRs

- Use **feature branches**:  
  `git checkout -b feature/your-feature-name`

- Keep pull requests **scoped and descriptive**:
  - What feature or fix you made
  - Why its helpful

## 📄 License

This project is licensed under the [MIT License](./LICENSE).  
You're free to use, modify, and distribute this software with proper attribution.
