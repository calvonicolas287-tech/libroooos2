import express from "express";
import { query } from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

function requireUser(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: "Token requerido" }); return null; }
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { res.status(401).json({ error: "Token inválido" }); return null; }
}

async function ensureCart(userId) {
  const existing = await query(`SELECT * FROM carritos WHERE usuario_id=$1`, [userId]);
  if (existing.rows[0]) return existing.rows[0];
  const created = await query(`INSERT INTO carritos (usuario_id) VALUES ($1) RETURNING *`, [userId]);
  return created.rows[0];
}

router.get("/", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const cart = await ensureCart(user.id);
  const items = await query(
    `SELECT ci.id, ci.cantidad, l.id AS libro_id, l.titulo, l.precio, l.imagen
     FROM carrito_items ci JOIN libros l ON l.id=ci.libro_id WHERE ci.carrito_id=$1`,
    [cart.id]
  );
  res.json({ cartId: cart.id, items: items.rows });
});

router.post("/add", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const { libro_id, cantidad } = req.body;
  const cart = await ensureCart(user.id);
  const existing = await query(`SELECT * FROM carrito_items WHERE carrito_id=$1 AND libro_id=$2`, [cart.id, libro_id]);
  if (existing.rows[0]) {
    const updated = await query(
      `UPDATE carrito_items SET cantidad=cantidad+$1 WHERE id=$2 RETURNING *`,
      [cantidad || 1, existing.rows[0].id]
    );
    return res.json(updated.rows[0]);
  }
  const created = await query(
    `INSERT INTO carrito_items (carrito_id, libro_id, cantidad) VALUES ($1,$2,$3) RETURNING *`,
    [cart.id, libro_id, cantidad || 1]
  );
  res.status(201).json(created.rows[0]);
});

router.post("/remove", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const { item_id } = req.body;
  await query(`DELETE FROM carrito_items WHERE id=$1`, [item_id]);
  res.status(204).end();
});

router.post("/clear", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const cart = await ensureCart(user.id);
  await query(`DELETE FROM carrito_items WHERE carrito_id=$1`, [cart.id]);
  res.status(204).end();
});

export default router;
