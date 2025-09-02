import express from "express";
import mercadopago from "mercadopago";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = express.Router();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN || ""
});

function requireUser(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: "Token requerido" }); return null; }
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { res.status(401).json({ error: "Token inválido" }); return null; }
}

router.post("/checkout", async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  const { pedido_id } = req.body;
  let items = [];

  if (pedido_id) {
    const detalle = await query(
      `SELECT d.cantidad, d.precio_unitario, l.titulo 
       FROM detalle_pedido d JOIN libros l ON l.id=d.libro_id WHERE d.pedido_id=$1`,
      [pedido_id]
    );
    if (detalle.rows.length === 0) return res.status(404).json({ error: "Pedido no encontrado" });
    items = detalle.rows.map((r) => ({
      title: r.titulo,
      quantity: r.cantidad,
      currency_id: "ARS",
      unit_price: Number(r.precio_unitario)
    }));
  } else {
    const cartQ = await query(`SELECT * FROM carritos WHERE usuario_id=$1`, [user.id]);
    const cart = cartQ.rows[0];
    if (!cart) return res.status(400).json({ error: "Carrito vacío" });
    const { rows } = await query(
      `SELECT l.titulo, l.precio, ci.cantidad FROM carrito_items ci JOIN libros l ON l.id=ci.libro_id WHERE ci.carrito_id=$1`,
      [cart.id]
    );
    if (rows.length === 0) return res.status(400).json({ error: "Carrito vacío" });
    items = rows.map(r => ({
      title: r.titulo,
      quantity: r.cantidad,
      currency_id: "ARS",
      unit_price: Number(r.precio)
    }));
  }

  const preference = {
    items,
    back_urls: {
      success: `${process.env.PUBLIC_URL}/?status=success`,
      failure: `${process.env.PUBLIC_URL}/?status=failure`,
      pending: `${process.env.PUBLIC_URL}/?status=pending`
    },
    auto_return: "approved",
    notification_url: `${process.env.PUBLIC_URL}/api/payments/webhook`
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id, init_point: response.body.init_point, sandbox_init_point: response.body.sandbox_init_point });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando preference" });
  }
});

router.post("/webhook", async (req, res) => {
  res.sendStatus(200);
});

export default router;
