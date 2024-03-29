import door from "./routes/door/door_functions.js";
import user from "./routes/user/user_functions.js";
import express from "express";
import cors from "cors";
import bp from "body-parser";
const port = 8087;
const app = express();
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(cors());
app.use(door);
app.use(user);
app.get("/", (req, res) => {
    res.send("System working");
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
//# sourceMappingURL=index.js.map