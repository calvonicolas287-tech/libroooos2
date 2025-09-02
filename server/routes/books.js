import express from "express";
import { query } from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

function admin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return false;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.rol === "admin";
  } catch { return false; }
}

router.get("/", async (_req, res) => {
  const result = await query(`SELECT * FROM libros ORDER BY id DESC`);
  res.json(result.rows);
});

router.post("/", async (req, res) => {
  if (!admin(req)) return res.status(403).json({ error: "Solo admin" });
  const { titulo, autor, precio, stock, imagen, descripcion, categoria } = req.body;
  const result = await query(
    `INSERT INTO libros (titulo, autor, precio, stock, imagen, descripcion, categoria)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [titulo, autor, precio, stock ?? 0, imagen, descripcion, categoria]
  );
  res.status(201).json(result.rows[0]);
});

router.put("/:id", async (req, res) => {
  if (!admin(req)) return res.status(403).json({ error: "Solo admin" });
  const { titulo, autor, precio, stock, imagen, descripcion, categoria } = req.body;
  const result = await query(
    `UPDATE libros SET titulo=$1, autor=$2, precio=$3, stock=$4, imagen=$5, descripcion=$6, categoria=$7 WHERE id=$8 RETURNING *`,
    [titulo, autor, precio, stock, imagen, descripcion, categoria, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req, res) => {
  if (!admin(req)) return res.status(403).json({ error: "Solo admin" });
  await query(`DELETE FROM libros WHERE id=$1`, [req.params.id]);
  res.status(204).end();
});

export default router;
