import http from "http";
import app, { connectDB } from "./app.js";

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
