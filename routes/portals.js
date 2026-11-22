import express from "express";

const router = express.Router();

// Example data — replace with real Lantern data when available.
const portals = [
  { id: 1, name: "Memory Trunk Realm" },
  { id: 2, name: "Village Portal" },
  { id: 3, name: "Cosmic Boundary Codex" }
];

router.get("/", (_req, res) => {
  res.json(portals);
});

export default router;
