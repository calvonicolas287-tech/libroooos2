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

router.get("/mine", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const orders = await query(`SELECT * FROM pedidos WHERE usuario_id=$1 ORDER BY id DESC`, [user.id]);
  res.json(orders.rows);
});

router.post("/checkout", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const { direccion } = req.body;
  const cartQ = await query(`SELECT * FROM carritos WHERE usuario_id=$1`, [user.id]);
  const cart = cartQ.rows[0];
  if (!cart) return res.status(400).json({ error: "Carrito vacío" });
  const { rows: items } = await query(
    `SELECT ci.cantidad, l.id as libro_id, l.precio FROM carrito_items ci JOIN libros l ON l.id=ci.libro_id WHERE ci.carrito_id=$1`,
    [cart.id]
  );
  if (items.length === 0) return res.status(400).json({ error: "Carrito vacío" });
  const total = items.reduce((s, it) => s + Number(it.precio) * it.cantidad, 0);
  const pedido = await query(
    `INSERT INTO pedidos (usuario_id, direccion, estado, total) VALUES ($1,$2,'pendiente',$3) RETURNING *`,
    [user.id, direccion || null, total]
  );
  const pedidoId = pedido.rows[0].id;
  for (const it of items) {
    await query(
      `INSERT INTO detalle_pedido (pedido_id, libro_id, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)`,
      [pedidoId, it.libro_id, it.cantidad, it.precio]
    );
  }
  res.status(201).json(pedido.rows[0]);
});

export default router;
