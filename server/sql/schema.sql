-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) DEFAULT 'cliente'
);

-- Libros
CREATE TABLE IF NOT EXISTS libros (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INT DEFAULT 0,
  imagen TEXT,
  descripcion TEXT,
  categoria VARCHAR(100)
);

-- Carritos
CREATE TABLE IF NOT EXISTS carritos (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carrito_items (
  id SERIAL PRIMARY KEY,
  carrito_id INT NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  libro_id INT NOT NULL REFERENCES libros(id),
  cantidad INT NOT NULL DEFAULT 1
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  fecha TIMESTAMP DEFAULT NOW(),
  direccion TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  total NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  libro_id INT NOT NULL REFERENCES libros(id),
  cantidad INT NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL
);
