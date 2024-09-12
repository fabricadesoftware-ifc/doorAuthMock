import door from "./routes/door/door_functions.js";
import user from "./routes/user/user_functions.js";
import express from "express";
import cors from "cors";
import bp from "body-parser";
import { Server } from "socket.io";
import { createServer } from "node:http";
const port = 8087;
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
// allow all origins
app.use(cors()); // Allow all origins
app.use(door);
app.use(user);
app.get("/", (req, res) => {
    console.log(req.ip);
    res.send("System working");
});
// socket
io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
    });
});
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
export const updateFront = () => {
    io.emit("updateFront", true);
};
//# sourceMappingURL=index.js.map