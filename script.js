const EXCHANGE_RATE = 7.8; // 1 USD = 7.8 GTQ
const STORE_NAME = "TECNOSTORE";
const FUNNY_CAT_PHRASES = [
  "Miau ja ja",
  "Ronroneo de oferta",
  "Carrito con bigotes",
  "Gatito aprobador",
  "Mision tecno completada"
];
const NYAN_CAT_IMAGE_URL = "https://media.giphy.com/media/sIIhZliB2McAo/giphy.gif";
const AUTHORIZED_PAYMENT_USERS = [
  {
    name: "Maria Lopez",
    cardNumber: "4242424242424242",
    expiry: "12/29",
    cvv: "123",
    accountLabel: "Cuenta Tecno Plus"
  },
  {
    name: "Carlos Ramirez",
    cardNumber: "5555555555554444",
    expiry: "11/30",
    cvv: "456",
    accountLabel: "Cuenta Quantum"
  },
  {
    name: "Ana Torres",
    cardNumber: "4012888888881881",
    expiry: "08/31",
    cvv: "321",
    accountLabel: "Cuenta Neon"
  }
];

const products = [
  {
    id: 1,
    name: "Laptop Gamer 15",
    priceQ: 6899,
    stock: 4,
    colorA: "#2d7ff9",
    colorB: "#6dd5fa",
    icon: "LAPTOP",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 2,
    name: "Monitor 27 Full HD",
    priceQ: 1749,
    stock: 6,
    colorA: "#38b2ac",
    colorB: "#7ef9c4",
    icon: "MONITOR",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 3,
    name: "Teclado Mecanico RGB",
    priceQ: 499,
    stock: 8,
    colorA: "#ff7b54",
    colorB: "#ffd36f",
    icon: "KEYBOARD",
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 4,
    name: "Mouse Inalambrico Pro",
    priceQ: 289,
    stock: 10,
    colorA: "#8663f7",
    colorB: "#c9b6ff",
    icon: "MOUSE",
    imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 5,
    name: "SSD 1TB NVMe",
    priceQ: 899,
    stock: 5,
    colorA: "#1e8f7f",
    colorB: "#8ae5cf",
    icon: "SSD",
    imageUrl: "https://images.unsplash.com/photo-1591799265444-d66432b91588?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 6,
    name: "Audifonos Bluetooth",
    priceQ: 399,
    stock: 7,
    colorA: "#ef4444",
    colorB: "#f9a8d4",
    icon: "AUDIO",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"
  }
].map((item) => {
  const fallbackImage = createProductImage(item);
  return { ...item, fallbackImage, image: item.imageUrl || fallbackImage };
});

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
const paymentTotalValueEl = document.getElementById("payment-total-value");
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
  setupEvents();
  renderProducts();
  renderCart();
}

function setupEvents() {
  productListEl.addEventListener("click", onProductGridClick);
  cartItemsEl.addEventListener("click", onCartClick);
  clearCartBtn.addEventListener("click", onClearCartClick);
  currencySelect.addEventListener("change", onCurrencyChange);
  themeToggleBtn.addEventListener("click", toggleTheme);
  paymentForm.addEventListener("submit", onValidatePayment);
  cardNumberInput.addEventListener("input", onCardNumberInput);
  cardExpiryInput.addEventListener("input", onCardExpiryInput);
  cardCvvInput.addEventListener("input", onCardCvvInput);
  productListEl.addEventListener("error", onImageError, true);
  previewImage.addEventListener("error", onImageError);
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

function onImageError(event) {
  const img = event.target;
  if (img && img.tagName === "IMG" && img.dataset.fallback && img.src !== img.dataset.fallback) {
    img.src = img.dataset.fallback;
  }
}

function renderProducts() {
  productListEl.innerHTML = products.map((product) => {
    const remainingStock = getRemainingStock(product.id);
    const stockClass = remainingStock === 0 ? "is-out" : remainingStock <= 2 ? "is-low" : "";
    const addDisabled = remainingStock === 0 ? "disabled" : "";
    const addLabel = remainingStock === 0 ? "Sin existencias" : "Agregar al carrito";

    return `
      <article class="product-card">
        <button class="preview-trigger" type="button" data-action="preview" data-id="${product.id}">
          <img src="${product.image}" data-fallback="${product.fallbackImage}" alt="${product.name}">
        </button>
        <div class="product-body">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">${formatCurrencyFromQ(product.priceQ)}</p>
          <p class="product-stock ${stockClass}">Existencias: ${remainingStock} de ${product.stock}</p>
          <button type="button" data-action="add" data-id="${product.id}" ${addDisabled}>${addLabel}</button>
        </div>
      </article>
    `;
  }).join("");
  applyImageFallbackIfNeeded();
}

function applyImageFallbackIfNeeded() {
  const images = productListEl.querySelectorAll("img[data-fallback]");
  images.forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.dataset.fallback) {
      img.src = img.dataset.fallback;
    }
  });
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
  updatePaymentTotalPreview(totalQ);
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

  renderProducts();
  renderCart();
}

function addToCart(productId) {
  const product = products.find((entry) => entry.id === productId);
  if (!product) {
    return;
  }

  if (getRemainingStock(productId) <= 0) {
    showPaymentErrorAlert(
      "Sin existencias",
      "Este producto ya alcanzo su limite de existencias.",
      [`Producto: ${product.name}`, `Existencias maximas: ${product.stock}`]
    );
    return;
  }

  const item = cart.find((entry) => entry.productId === productId);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  renderProducts();
  renderCart();
  showFunnyCatAlert(product?.name || "Producto");
}

async function onClearCartClick() {
  if (cart.length === 0) {
    showPaymentErrorAlert(
      "Carrito vacio",
      "El carrito ya esta vacio.",
      ["Agrega productos antes de continuar con una compra."]
    );
    return;
  }

  if (!window.Swal) {
    clearCart();
    return;
  }

  const theme = getSwalThemeOptions();
  const itemCount = getCartItemCount();
  const totalQ = getCartTotalQ();
  const result = await window.Swal.fire({
    icon: "warning",
    title: "Confirmar vaciado del carrito",
    html: `
      <p>Estas por eliminar <strong>${itemCount} producto(s)</strong>.</p>
      <p>Total actual: <strong>${formatCurrencyFromQ(totalQ)}</strong></p>
      <p>Esta accion no se puede deshacer.</p>
    `,
    showCancelButton: true,
    confirmButtonText: "Si, vaciar carrito",
    cancelButtonText: "Cancelar",
    confirmButtonColor: theme.danger,
    cancelButtonColor: theme.primary,
    reverseButtons: true,
    backdrop: "rgba(12, 20, 34, 0.72)",
    background: theme.background,
    color: theme.color,
    customClass: {
      popup: "swal-tech-popup",
      title: "swal-tech-title",
      htmlContainer: "swal-tech-body"
    },
    ...getNyanImageOptions(210, 118)
  });

  if (!result.isConfirmed) {
    return;
  }

  clearCart();

  await window.Swal.fire({
    icon: "success",
    title: "Carrito vaciado",
    text: "Puedes seguir explorando productos en TECNOSTORE.",
    timer: 1700,
    timerProgressBar: true,
    showConfirmButton: false,
    backdrop: "rgba(12, 20, 34, 0.45)",
    background: theme.background,
    color: theme.color,
    customClass: {
      popup: "swal-tech-popup",
      title: "swal-tech-title"
    },
    ...getNyanImageOptions(210, 118)
  });
}

function clearCart() {
  cart = [];
  renderProducts();
  renderCart();
  showStatus("Carrito vaciado.", "success");
}

function getCartItemCount() {
  return cart.reduce((acc, item) => acc + item.qty, 0);
}

function getRemainingStock(productId) {
  const product = products.find((entry) => entry.id === productId);
  if (!product) {
    return 0;
  }

  const quantityInCart = cart
    .filter((item) => item.productId === productId)
    .reduce((acc, item) => acc + item.qty, 0);

  return Math.max(product.stock - quantityInCart, 0);
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
}

function updatePaymentTotalPreview(totalQ) {
  paymentTotalValueEl.textContent = formatCurrencyFromQ(totalQ);
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
    showPaymentErrorAlert(
      "Carrito vacio",
      "No puedes pagar con el carrito vacio.",
      ["Agrega al menos un producto antes de validar el pago."]
    );
    return;
  }

  const payerName = document.getElementById("payer-name").value.trim();
  const cardNumberRaw = document.getElementById("card-number").value;
  const cardExpiry = document.getElementById("card-expiry").value.trim();
  const cardCvv = document.getElementById("card-cvv").value.trim();
  const cardNumber = cardNumberRaw.replace(/\D/g, "");

  if (payerName.length < 3) {
    showPaymentErrorAlert("Nombre invalido", "Ingresa un nombre valido.");
    return;
  }

  if (!/^\d{16}$/.test(cardNumber)) {
    showPaymentErrorAlert("Tarjeta invalida", "La tarjeta debe tener 16 digitos numericos.");
    return;
  }

  if (!isValidExpiry(cardExpiry)) {
    showPaymentErrorAlert("Vencimiento invalido", "Fecha de vencimiento invalida o expirada.");
    return;
  }

  if (!/^\d{3,4}$/.test(cardCvv)) {
    showPaymentErrorAlert("CVV invalido", "El CVV debe tener 3 o 4 digitos.");
    return;
  }

  const authorizedUser = findAuthorizedPaymentUser(payerName, cardNumber, cardExpiry, cardCvv);
  if (!authorizedUser) {
    showPaymentErrorAlert(
      "Tarjeta no autorizada",
      "Los datos no coinciden con una cuenta habilitada.",
      [
        "Verifica nombre, numero de tarjeta, vencimiento y CVV.",
        ...AUTHORIZED_PAYMENT_USERS.map((user) => `${user.name}: ${maskCardNumber(user.cardNumber)} | ${user.expiry}`)
      ]
    );
    return;
  }

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
    paidQ: totalQ,
    accountLabel: authorizedUser.accountLabel,
    maskedCard: maskCardNumber(authorizedUser.cardNumber)
  };

  generatePdfBtn.disabled = false;
  cart = [];
  paymentForm.reset();
  renderProducts();
  renderCart();

  showNyanSuccessAlert(
    "Pago validado",
    `Pago validado. Total cobrado: ${formatCurrencyFromQ(totalQ)}. Ya puedes generar el recibo PDF.`
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
    showPaymentErrorAlert("Pago pendiente", "Primero valida un pago para generar el recibo.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showPaymentErrorAlert("PDF no disponible", "No se pudo cargar la libreria PDF. Revisa la conexion a internet.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const data = latestReceiptData;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const drawPageShell = () => {
    doc.setFillColor(8, 15, 32);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setDrawColor(18, 47, 80);
    doc.setLineWidth(0.15);
    for (let y = 46; y < pageHeight; y += 8) {
      doc.line(0, y, pageWidth, y);
    }
    for (let x = 0; x < pageWidth; x += 8) {
      doc.line(x, 46, x, pageHeight);
    }

    doc.setFillColor(10, 29, 56);
    doc.rect(0, 0, pageWidth, 44, "F");
    doc.setFillColor(0, 163, 255);
    doc.rect(0, 42, pageWidth, 2, "F");

    doc.setDrawColor(0, 219, 255);
    doc.setLineWidth(0.6);
    doc.circle(pageWidth - 24, 15, 7);
    doc.circle(pageWidth - 24, 15, 3.5);
    doc.line(pageWidth - 42, 15, pageWidth - 31, 15);
    doc.line(pageWidth - 24, 23, pageWidth - 24, 33);
  };

  const drawTableHeader = (startY) => {
    doc.setFillColor(16, 52, 92);
    doc.roundedRect(margin, startY, contentWidth, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(214, 236, 255);
    doc.text("Producto", margin + 3, startY + 5.4);
    doc.text("Cant.", margin + 100, startY + 5.4, { align: "center" });
    doc.text("Precio", margin + 136, startY + 5.4, { align: "right" });
    doc.text("Subtotal", margin + contentWidth - 3, startY + 5.4, { align: "right" });
  };

  drawPageShell();

  doc.setTextColor(240, 248, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(STORE_NAME, margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Recibo de compra digital", margin, 23);

  doc.setFillColor(13, 36, 68);
  doc.setDrawColor(46, 117, 183);
  doc.roundedRect(margin, 28, contentWidth, 27, 2.2, 2.2, "FD");
  doc.setFontSize(9.5);
  doc.setTextColor(212, 232, 250);
  doc.text(`Transaccion: ${data.transactionId}`, margin + 3, 35);
  doc.text(`Fecha: ${data.date}`, margin + 3, 41);
  doc.text(`Cliente: ${data.payerName}`, margin + 3, 47);
  doc.text(`Tarjeta: ${data.maskedCard || "**** **** **** ----"}`, margin + 100, 35);
  doc.text(`Perfil: ${data.accountLabel || "Cuenta registrada"}`, margin + 100, 41);
  doc.text(`Moneda: ${data.currency}`, margin + 100, 47);

  let y = 63;
  drawTableHeader(y);
  y += 11;

  data.items.forEach((item, index) => {
    const productLines = doc.splitTextToSize(item.name, 86);
    const rowHeight = Math.max(8, productLines.length * 4 + 2);

    if (y + rowHeight > pageHeight - 50) {
      doc.addPage();
      drawPageShell();
      y = 22;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(191, 226, 255);
      doc.text("Detalle de productos (continuacion)", margin, 15);
      drawTableHeader(y);
      y += 11;
    }

    const rowFill = index % 2 === 0 ? [12, 30, 56] : [10, 25, 47];
    doc.setFillColor(rowFill[0], rowFill[1], rowFill[2]);
    doc.setDrawColor(30, 71, 116);
    doc.roundedRect(margin, y - 1, contentWidth, rowHeight, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(230, 243, 255);
    doc.text(productLines, margin + 2, y + 2.8);
    doc.text(String(item.qty), margin + 100, y + 2.8, { align: "center" });
    doc.text(formatCurrencyForReceipt(item.priceQ, data.currency), margin + 136, y + 2.8, { align: "right" });
    doc.text(formatCurrencyForReceipt(item.subtotalQ, data.currency), margin + contentWidth - 3, y + 2.8, { align: "right" });
    y += rowHeight + 2;
  });

  if (y > pageHeight - 52) {
    doc.addPage();
    drawPageShell();
    y = 28;
  }

  const summaryWidth = 86;
  const summaryX = pageWidth - margin - summaryWidth;
  doc.setFillColor(13, 36, 68);
  doc.setDrawColor(46, 117, 183);
  doc.roundedRect(summaryX, y + 2, summaryWidth, 26, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(210, 235, 255);
  doc.text("Resumen de pago", summaryX + 3, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Total:", summaryX + 3, y + 15);
  doc.text(formatCurrencyForReceipt(data.totalQ, data.currency), summaryX + summaryWidth - 3, y + 15, { align: "right" });
  doc.text("Cobrado:", summaryX + 3, y + 21);
  doc.text(formatCurrencyForReceipt(data.paidQ, data.currency), summaryX + summaryWidth - 3, y + 21, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(128, 188, 235);
  doc.text("TECNOSTORE // RECIBO ELECTRONICO VERIFICADO", margin, pageHeight - 10);

  doc.save(`${data.transactionId}.pdf`);
  showNyanSuccessAlert("Recibo generado", "Recibo PDF generado correctamente.");
}

function findAuthorizedPaymentUser(payerName, cardNumber, cardExpiry, cardCvv) {
  const normalizedPayerName = normalizeName(payerName);
  return AUTHORIZED_PAYMENT_USERS.find((user) =>
    normalizeName(user.name) === normalizedPayerName &&
    user.cardNumber === cardNumber &&
    user.expiry === cardExpiry &&
    user.cvv === cardCvv
  );
}

function normalizeName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function maskCardNumber(cardNumber) {
  return `**** **** **** ${cardNumber.slice(-4)}`;
}

function openPreview(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }
  previewImage.src = product.image;
  previewImage.dataset.fallback = product.fallbackImage;
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

function showStatus(message, type) {
  statusMessageEl.textContent = message;
  statusMessageEl.classList.remove("status-error", "status-success");
  statusMessageEl.classList.add(type === "error" ? "status-error" : "status-success");
}

function getSwalThemeOptions() {
  const style = getComputedStyle(document.body);
  return {
    background: style.getPropertyValue("--surface").trim() || "#ffffff",
    color: style.getPropertyValue("--text").trim() || "#17212f",
    primary: style.getPropertyValue("--primary").trim() || "#1769ff",
    danger: style.getPropertyValue("--danger").trim() || "#b42318"
  };
}

function getNyanImageOptions(width = 220, height = 124) {
  return {
    imageUrl: NYAN_CAT_IMAGE_URL,
    imageWidth: width,
    imageHeight: height,
    imageAlt: "Nyan Cat"
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function showNyanSuccessAlert(title, message) {
  showStatus(message, "success");
  if (!window.Swal) {
    return;
  }

  const theme = getSwalThemeOptions();
  window.Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonText: "Perfecto",
    confirmButtonColor: theme.primary,
    backdrop: "rgba(12, 20, 34, 0.72)",
    background: theme.background,
    color: theme.color,
    customClass: {
      popup: "swal-tech-popup",
      title: "swal-tech-title",
      htmlContainer: "swal-tech-body"
    },
    ...getNyanImageOptions(210, 118)
  });
}

function showPaymentErrorAlert(title, message, details = []) {
  showStatus(message, "error");
  if (!window.Swal) {
    return;
  }

  const theme = getSwalThemeOptions();
  const detailsHtml = details.length
    ? `<ul class="swal-tech-list">${details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>`
    : "";

  window.Swal.fire({
    icon: "warning",
    title,
    html: `<p>${escapeHtml(message)}</p>${detailsHtml}`,
    confirmButtonText: "Corregir ahora",
    confirmButtonColor: theme.primary,
    backdrop: "rgba(12, 20, 34, 0.72)",
    background: theme.background,
    color: theme.color,
    customClass: {
      popup: "swal-tech-popup",
      title: "swal-tech-title",
      htmlContainer: "swal-tech-body"
    },
    ...getNyanImageOptions(210, 118)
  });
}

function showFunnyCatAlert(productName) {
  if (!window.Swal) {
    showStatus(`${productName} agregado al carrito.`, "success");
    return;
  }

  const phrase = FUNNY_CAT_PHRASES[Math.floor(Math.random() * FUNNY_CAT_PHRASES.length)];
  const theme = getSwalThemeOptions();

  window.Swal.fire({
    toast: true,
    position: "top-end",
    title: `${productName} agregado`,
    text: `Nyan Cat: ${phrase}`,
    imageUrl: NYAN_CAT_IMAGE_URL,
    imageWidth: 170,
    imageHeight: 96,
    imageAlt: "Nyan Cat",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    backdrop: "transparent",
    background: theme.background,
    color: theme.color,
    customClass: {
      popup: "swal-tech-popup"
    }
  });
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
