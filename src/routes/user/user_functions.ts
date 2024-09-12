import express from "express";
import { listAllUser, createUser, isUserSynced } from "../../db/db.js";
import { Request, Response } from "express";
import { CreateUser } from "../../interface/interface_index.js";
import { user } from "@prisma/client";
const router = express.Router();

router.post("/create/", (req: Request, res: Response) => {
  const name: string = req.body.name;
  const email: string = req.body.email;

  createUser(name, email);


  res.send("User created");
});

router.get("/users/", async (req, res) => {
  const users = await listAllUser();
  res.send(users);
});

// router.post("/assign/", async (req: express.Request, res: express.Response) => {
//   const rfid: string = req.body.rfid;
//   const email: string = req.body.email;

//   await assignRfidToUser(rfid, email);

//   res.send(`${rfid} assigned to ${email}`);
// });

router.post("/sync/", async (req: express.Request, res: express.Response) => {
  const name: string = req.body.name;
  const firebase_id: string = req.body.firebase_id;

  await isUserSynced(firebase_id, name);

  res.send(`${name} synced`);
});

export default router;
