let token = localStorage.getItem("token") || null;

async function api(path, opts={}) {
  const headers = opts.headers || {};
  if (!headers["Content-Type"] && opts.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) throw await res.json().catch(() => ({ error: res.statusText }));
  return res.json().catch(() => ({}));
}

async function renderBooks() {
  const grid = document.querySelector("#spa-books");
  if (!grid) return;
  const books = await api("/api/books");
  grid.innerHTML = books.map(b => `
    <div class="col-12 col-md-4 mb-4">
      <div class="card h-100">
        <a href="#">
          <img src="${b.imagen || 'https://placehold.co/600x400?text=Libro'}" class="card-img-top" alt="${b.titulo}">
        </a>
        <div class="card-body">
          <a href="#" class="h2 text-decoration-none text-dark">${b.titulo}</a>
          <p class="card-text">${b.autor || ''}</p>
          <p class="text-muted price">$ ${Number(b.precio).toFixed(2)}</p>
          <button class="btn btn-outline-success btn-sm add-to-cart" data-id="${b.id}">Agregar</button>
        </div>
      </div>
    </div>
  `).join("");
}

function bindNavbar() {
  const loginLink = document.querySelector("#spa-login");
  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = new bootstrap.Modal(document.getElementById('authModal'));
      modal.show();
    });
  }
  const cartLink = document.querySelector("#spa-cart");
  if (cartLink) {
    cartLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await updateCartCount(true);
    });
  }
}

async function updateCartCount(showAlert=false) {
  const countEl = document.querySelector("#cart-count");
  if (!token) { if (countEl) countEl.textContent = "0"; return; }
  try {
    const data = await api("/api/cart");
    if (countEl) countEl.textContent = (data.items || []).length;
    if (showAlert) alert("Tienes " + ((data.items || []).length) + " ítems en el carrito.");
  } catch {}
}

function bindAuth() {
  const loginBtn = document.getElementById("btn-login");
  const registerBtn = document.getElementById("btn-register");
  const msg = document.getElementById("auth-msg");
  loginBtn?.addEventListener("click", async () => {
    msg.textContent = "";
    try {
      const email = document.getElementById("auth-email").value;
      const password = document.getElementById("auth-pass").value;
      const res = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      token = res.token; localStorage.setItem("token", token);
      bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
      await updateCartCount();
    } catch (e) {
      msg.textContent = e.error || "Error";
    }
  });
  registerBtn?.addEventListener("click", async () => {
    msg.textContent = "";
    try {
      const email = document.getElementById("auth-email").value;
      const password = document.getElementById("auth-pass").value;
      const res = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      token = res.token; localStorage.setItem("token", token);
      bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
      await updateCartCount();
    } catch (e) {
      msg.textContent = e.error || "Error";
    }
  });
}

function bindAddToCart() {
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    e.preventDefault();
    if (!token) {
      const modal = new bootstrap.Modal(document.getElementById('authModal'));
      modal.show();
      return;
    }
    try {
      await api("/api/cart/add", { method: "POST", body: JSON.stringify({ libro_id: btn.dataset.id, cantidad: 1 }) });
      await updateCartCount(true);
    } catch (err) {
      alert(err.error || "No se pudo agregar");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindNavbar();
  bindAuth();
  await renderBooks();
  bindAddToCart();
  await updateCartCount();
});
