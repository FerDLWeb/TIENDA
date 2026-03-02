const EXCHANGE_RATE = 7.8; // 1 USD = 7.8 GTQ

const products = [
  { id: 1, name: "Laptop Gamer 15", priceQ: 6899, colorA: "#2d7ff9", colorB: "#6dd5fa", icon: "LAPTOP" },
  { id: 2, name: "Monitor 27 Full HD", priceQ: 1749, colorA: "#38b2ac", colorB: "#7ef9c4", icon: "MONITOR" },
  { id: 3, name: "Teclado Mecanico RGB", priceQ: 499, colorA: "#ff7b54", colorB: "#ffd36f", icon: "KEYBOARD" },
  { id: 4, name: "Mouse Inalambrico Pro", priceQ: 289, colorA: "#8663f7", colorB: "#c9b6ff", icon: "MOUSE" },
  { id: 5, name: "SSD 1TB NVMe", priceQ: 899, colorA: "#1e8f7f", colorB: "#8ae5cf", icon: "SSD" },
  { id: 6, name: "Audifonos Bluetooth", priceQ: 399, colorA: "#ef4444", colorB: "#f9a8d4", icon: "AUDIO" }
].map((item) => ({ ...item, image: createProductImage(item) }));

const productListEl = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const clearCartBtn = document.getElementById("clear-cart");
const currencySelect = document.getElementById("currency-select");
const themeToggleBtn = document.getElementById("theme-toggle");
const statusMessageEl = document.getElementById("status-message");
const paymentForm = document.getElementById("payment-form");
const cardNumberInput = document.getElementById("card-number");
const cardExpiryInput = document.getElementById("card-expiry");
const cardCvvInput = document.getElementById("card-cvv");
const paymentAmountInput = document.getElementById("payment-amount");
const generatePdfBtn = document.getElementById("generate-pdf");
const previewModal = document.getElementById("preview-modal");
const previewImage = document.getElementById("preview-image");
const previewTitle = document.getElementById("preview-title");
const previewPrice = document.getElementById("preview-price");
const closePreviewBtn = document.getElementById("close-preview");

let cart = [];
let selectedCurrency = localStorage.getItem("shop_currency") || "GTQ";
let latestReceiptData = null;

initialize();

function initialize() {
  const savedTheme = localStorage.getItem("shop_theme") || "light";
  document.body.dataset.theme = savedTheme;
  themeToggleBtn.textContent = savedTheme === "light" ? "Modo Oscuro" : "Modo Claro";

  currencySelect.value = selectedCurrency;
  updatePaymentPlaceholder();
  renderProducts();
  renderCart();
  setupEvents();
}

function setupEvents() {
  productListEl.addEventListener("click", onProductGridClick);
  cartItemsEl.addEventListener("click", onCartClick);
  clearCartBtn.addEventListener("click", clearCart);
  currencySelect.addEventListener("change", onCurrencyChange);
  themeToggleBtn.addEventListener("click", toggleTheme);
  paymentForm.addEventListener("submit", onValidatePayment);
  cardNumberInput.addEventListener("input", onCardNumberInput);
  cardExpiryInput.addEventListener("input", onCardExpiryInput);
  cardCvvInput.addEventListener("input", onCardCvvInput);
  generatePdfBtn.addEventListener("click", generateReceiptPdf);
  closePreviewBtn.addEventListener("click", closePreview);
  previewModal.addEventListener("click", (event) => {
    if (event.target === previewModal) {
      closePreview();
    }
  });
}

function onCardNumberInput(event) {
  const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function onCardExpiryInput(event) {
  const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 4);
  if (digitsOnly.length <= 2) {
    event.target.value = digitsOnly;
    return;
  }
  event.target.value = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
}

function onCardCvvInput(event) {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
}

function renderProducts() {
  productListEl.innerHTML = products.map((product) => `
    <article class="product-card">
      <button class="preview-trigger" type="button" data-action="preview" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
      </button>
      <div class="product-body">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${formatCurrencyFromQ(product.priceQ)}</p>
        <button type="button" data-action="add" data-id="${product.id}">Agregar al carrito</button>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsEl.innerHTML = "<li class='cart-item'>El carrito esta vacio.</li>";
  } else {
    cartItemsEl.innerHTML = cart.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return `
        <li class="cart-item">
          <div class="item-info">
            <span class="item-name">${product.name}</span>
            <span class="item-sub">Cantidad: ${item.qty} | Subtotal: ${formatCurrencyFromQ(product.priceQ * item.qty)}</span>
          </div>
          <button class="remove-item" type="button" data-action="remove" data-id="${item.productId}">Quitar</button>
        </li>
      `;
    }).join("");
  }

  const totalQ = getCartTotalQ();
  cartTotalEl.textContent = formatCurrencyFromQ(totalQ);
}

function onProductGridClick(event) {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) {
    return;
  }

  const action = trigger.dataset.action;
  const productId = Number(trigger.dataset.id);

  if (action === "add") {
    addToCart(productId);
  }

  if (action === "preview") {
    openPreview(productId);
  }
}

function onCartClick(event) {
  const removeBtn = event.target.closest('[data-action="remove"]');
  if (!removeBtn) {
    return;
  }

  const productId = Number(removeBtn.dataset.id);
  cart = cart
    .map((item) => item.productId === productId ? { ...item, qty: item.qty - 1 } : item)
    .filter((item) => item.qty > 0);

  renderCart();
}

function addToCart(productId) {
  const item = cart.find((entry) => entry.productId === productId);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
  showStatus("Carrito vaciado.", "success");
}

function getCartTotalQ() {
  return cart.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + product.priceQ * item.qty;
  }, 0);
}

function onCurrencyChange(event) {
  selectedCurrency = event.target.value;
  localStorage.setItem("shop_currency", selectedCurrency);
  renderProducts();
  renderCart();
  updatePaymentPlaceholder();
}

function updatePaymentPlaceholder() {
  paymentAmountInput.placeholder = selectedCurrency === "GTQ" ? "Q0.00" : "$0.00";
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  localStorage.setItem("shop_theme", nextTheme);
  themeToggleBtn.textContent = nextTheme === "light" ? "Modo Oscuro" : "Modo Claro";
}

function onValidatePayment(event) {
  event.preventDefault();
  const totalQ = getCartTotalQ();
  if (totalQ <= 0) {
    showStatus("No puedes pagar con el carrito vacio.", "error");
    return;
  }

  const payerName = document.getElementById("payer-name").value.trim();
  const cardNumberRaw = document.getElementById("card-number").value;
  const cardExpiry = document.getElementById("card-expiry").value.trim();
  const cardCvv = document.getElementById("card-cvv").value.trim();
  const paymentAmountDisplay = Number(String(paymentAmountInput.value).replace(",", "."));
  const cardNumber = cardNumberRaw.replace(/\D/g, "");

  if (payerName.length < 3) {
    showStatus("Ingresa un nombre valido.", "error");
    return;
  }

  if (!/^\d{16}$/.test(cardNumber)) {
    showStatus("La tarjeta debe tener 16 digitos numericos.", "error");
    return;
  }

  if (!isValidExpiry(cardExpiry)) {
    showStatus("Fecha de vencimiento invalida o expirada.", "error");
    return;
  }

  if (!/^\d{3,4}$/.test(cardCvv)) {
    showStatus("El CVV debe tener 3 o 4 digitos.", "error");
    return;
  }

  if (!Number.isFinite(paymentAmountDisplay) || paymentAmountDisplay <= 0) {
    showStatus("Ingresa un monto de pago valido.", "error");
    return;
  }

  const paymentAmountQ = roundCurrency(fromDisplayCurrencyToQ(paymentAmountDisplay));
  const requiredPaymentQ = getRequiredPaymentQ(totalQ);
  if (paymentAmountQ < requiredPaymentQ) {
    showStatus("El monto pagado es menor al total de la compra.", "error");
    return;
  }

  const changeQ = roundCurrency(paymentAmountQ - requiredPaymentQ);
  latestReceiptData = {
    transactionId: `TX-${Date.now()}`,
    date: new Date().toLocaleString("es-GT"),
    currency: selectedCurrency,
    payerName,
    items: cart.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        name: product.name,
        qty: item.qty,
        priceQ: product.priceQ,
        subtotalQ: product.priceQ * item.qty
      };
    }),
    totalQ,
    paidQ: paymentAmountQ,
    changeQ
  };

  generatePdfBtn.disabled = false;
  cart = [];
  paymentForm.reset();
  updatePaymentPlaceholder();
  renderCart();

  showStatus(
    `Pago validado. Vuelto: ${formatCurrencyFromQ(changeQ)}. Ya puedes generar el recibo PDF.`,
    "success"
  );
}

function isValidExpiry(value) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
    return false;
  }

  const [month, year] = value.split("/").map(Number);
  const current = new Date();
  const currentMonth = current.getMonth() + 1;
  const currentYear2d = current.getFullYear() % 100;

  return year > currentYear2d || (year === currentYear2d && month >= currentMonth);
}

function generateReceiptPdf() {
  if (!latestReceiptData) {
    showStatus("Primero valida un pago para generar el recibo.", "error");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showStatus("No se pudo cargar la libreria PDF. Revisa la conexion a internet.", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = latestReceiptData;

  doc.setFontSize(16);
  doc.text("Recibo de Compra - Tienda Informatica", 14, 18);
  doc.setFontSize(11);
  doc.text(`Transaccion: ${data.transactionId}`, 14, 28);
  doc.text(`Fecha: ${data.date}`, 14, 35);
  doc.text(`Cliente: ${data.payerName}`, 14, 42);

  let y = 55;
  doc.setFontSize(12);
  doc.text("Detalle:", 14, y);
  y += 8;
  doc.setFontSize(10);

  data.items.forEach((item) => {
    const line = `${item.name} x${item.qty} - ${formatCurrencyForReceipt(item.subtotalQ, data.currency)}`;
    doc.text(line, 14, y);
    y += 7;
  });

  y += 4;
  doc.setFontSize(11);
  doc.text(`Total: ${formatCurrencyForReceipt(data.totalQ, data.currency)}`, 14, y);
  y += 7;
  doc.text(`Pagado: ${formatCurrencyForReceipt(data.paidQ, data.currency)}`, 14, y);
  y += 7;
  doc.text(`Vuelto: ${formatCurrencyForReceipt(data.changeQ, data.currency)}`, 14, y);

  doc.save(`${data.transactionId}.pdf`);
  showStatus("Recibo PDF generado correctamente.", "success");
}

function openPreview(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }
  previewImage.src = product.image;
  previewTitle.textContent = product.name;
  previewPrice.textContent = `Precio: ${formatCurrencyFromQ(product.priceQ)}`;
  previewModal.classList.remove("hidden");
}

function closePreview() {
  previewModal.classList.add("hidden");
}

function formatCurrencyFromQ(amountQ) {
  if (selectedCurrency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountQ / EXCHANGE_RATE);
  }
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", minimumFractionDigits: 2 }).format(amountQ);
}

function formatCurrencyForReceipt(amountQ, currency) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountQ / EXCHANGE_RATE);
  }
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", minimumFractionDigits: 2 }).format(amountQ);
}

function fromDisplayCurrencyToQ(value) {
  return selectedCurrency === "USD" ? value * EXCHANGE_RATE : value;
}

function getRequiredPaymentQ(totalQ) {
  if (selectedCurrency === "USD") {
    const totalRoundedUsd = roundCurrency(totalQ / EXCHANGE_RATE);
    return roundCurrency(totalRoundedUsd * EXCHANGE_RATE);
  }
  return roundCurrency(totalQ);
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function showStatus(message, type) {
  statusMessageEl.textContent = message;
  statusMessageEl.classList.remove("status-error", "status-success");
  statusMessageEl.classList.add(type === "error" ? "status-error" : "status-success");
}

function createProductImage(product) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${product.colorA}"/>
          <stop offset="100%" stop-color="${product.colorB}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#g)"/>
      <circle cx="680" cy="90" r="95" fill="rgba(255,255,255,0.18)"/>
      <rect x="110" y="150" rx="20" ry="20" width="580" height="240" fill="rgba(255,255,255,0.15)" />
      <text x="400" y="255" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial" font-size="58" font-weight="700">${product.icon}</text>
      <text x="400" y="320" text-anchor="middle" fill="#f8fbff" font-family="Segoe UI, Arial" font-size="30">${product.name}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
