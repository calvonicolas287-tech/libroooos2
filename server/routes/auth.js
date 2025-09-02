import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y password son requeridos" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3) RETURNING id, nombre, email, rol`,
      [nombre || null, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ user, token });
  } catch (e) {
    if (e.code == "23505") return res.status(409).json({ error: "Email ya registrado" });
    res.status(500).json({ error: "Error al registrar" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y password son requeridos" });
  const result = await query(`SELECT * FROM usuarios WHERE email=$1`, [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
  const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }, token });
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(`SELECT id, nombre, email, rol FROM usuarios WHERE id=$1`, [payload.id]);
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
});

export default router;
