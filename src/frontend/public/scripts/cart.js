(function () {
  var container = document.getElementById("cart-page");
  if (!container) return;

  var state = {
    feedbackMessage: "",
    feedbackType: "info"
  };

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str || "")));
    return div.innerHTML;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function getCartApi() {
    return window.GateCatCart || null;
  }

  function getCartSnapshot() {
    var cartApi = getCartApi();
    return cartApi ? cartApi.snapshot() : { items: [], count: 0, subtotal: 0 };
  }

  function getItemMaxQuantity(item) {
    var maxQuantity = Number(item && item.max_quantity);
    if (Number.isFinite(maxQuantity)) {
      return Math.max(0, maxQuantity);
    }

    return 0;
  }

  function sanitizeQuantity(value, maxQuantity) {
    var nextValue = Number.parseInt(value, 10);
    if (!Number.isFinite(nextValue)) nextValue = 1;
    nextValue = Math.max(1, nextValue);

    if (Number.isFinite(maxQuantity) && maxQuantity > 0) {
      nextValue = Math.min(nextValue, maxQuantity);
    }

    return nextValue;
  }

  function getQuantityLabel(count) {
    return count + " s\u1ea3n ph\u1ea9m";
  }

  function setFeedback(message, type) {
    state.feedbackMessage = message || "";
    state.feedbackType = type || "info";
  }

  function getStockLabel(item) {
    var maxQuantity = getItemMaxQuantity(item);

    if (item && item.product_status !== "active") {
      return "S\u1ea3n ph\u1ea9m t\u1ea1m th\u1eddi kh\u00f4ng kh\u1ea3 d\u1ee5ng";
    }

    if (maxQuantity <= 0) {
      return "\u0110\u00e3 h\u1ebft h\u00e0ng";
    }

    if (item && item.track_inventory === false) {
      return "S\u1ed1 l\u01b0\u1ee3ng linh ho\u1ea1t";
    }

    return "T\u1ed3n kho: " + Number(item && item.stock_quantity != null ? item.stock_quantity : 0);
  }

  function buildThumbHtml(item) {
    if (item.cover_image_url) {
      return (
        '<a href="/product/' +
        encodeURIComponent(item.slug || item.id) +
        '">' +
        '<img class="cart-item-thumb" src="' +
        escapeHtml(item.cover_image_url) +
        '" alt="' +
        escapeHtml(item.name) +
        '" loading="lazy" />' +
        "</a>"
      );
    }

    return (
      '<a class="cart-item-thumb--empty" href="/product/' +
      encodeURIComponent(item.slug || item.id) +
      '" aria-label="' +
      escapeHtml(item.name) +
      '">' +
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<rect x="3" y="3" width="18" height="18" rx="2"></rect>' +
      '<circle cx="8.5" cy="8.5" r="1.5"></circle>' +
      '<path d="m21 15-5-5L5 21"></path>' +
      "</svg>" +
      "</a>"
    );
  }

  function buildAlertHtml() {
    if (!state.feedbackMessage) {
      return "";
    }

    return (
      '<p class="cart-alert cart-alert--' +
      escapeHtml(state.feedbackType) +
      '">' +
      escapeHtml(state.feedbackMessage) +
      "</p>"
    );
  }

  function buildItemHtml(item) {
    var maxQuantity = getItemMaxQuantity(item);
    var quantity = Number(item && item.quantity ? item.quantity : 0);
    var compareHtml =
      item.compare_at_price && item.compare_at_price > item.price
        ? "<del>" + formatPrice(item.compare_at_price) + "</del>"
        : "";
    var skuHtml = item.sku
      ? '<p class="cart-item-meta">SKU: ' + escapeHtml(item.sku) + "</p>"
      : "";
    var controlsDisabled = maxQuantity <= 0 ? " disabled" : "";
    var inputMax = maxQuantity > 0 ? maxQuantity : Math.max(1, quantity);

    return (
      '<article class="cart-item" data-product-id="' +
      escapeHtml(item.product_id || item.id) +
      '">' +
      buildThumbHtml(item) +
      '<div class="cart-item-info">' +
      '<h3 class="cart-item-name"><a href="/product/' +
      encodeURIComponent(item.slug || item.id) +
      '">' +
      escapeHtml(item.name) +
      "</a></h3>" +
      skuHtml +
      '<p class="cart-item-stock">' +
      escapeHtml(getStockLabel(item)) +
      "</p>" +
      '<div class="cart-item-price">' +
      "<strong>" +
      formatPrice(item.price) +
      "</strong>" +
      compareHtml +
      "</div>" +
      "</div>" +
      '<div class="cart-item-actions">' +
      '<div class="cart-qty">' +
      '<button type="button" data-qty-dec aria-label="Gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng"' +
      controlsDisabled +
      ">-</button>" +
      '<input type="number" min="1" max="' +
      inputMax +
      '" value="' +
      quantity +
      '" data-qty-input' +
      controlsDisabled +
      " />" +
      '<button type="button" data-qty-inc aria-label="T\u0103ng s\u1ed1 l\u01b0\u1ee3ng"' +
      controlsDisabled +
      ">+</button>" +
      "</div>" +
      '<p class="cart-item-meta">T\u1ea1m t\u00ednh: ' +
      formatPrice(item.line_subtotal) +
      "</p>" +
      '<button class="cart-remove" type="button" data-remove-item>X\u00f3a</button>' +
      "</div>" +
      "</article>"
    );
  }

  function buildSummaryHtml(summary) {
    return (
      '<section class="cart-summary">' +
      "<h2>T\u00f3m t\u1eaft \u0111\u01a1n h\u00e0ng</h2>" +
      '<div class="cart-summary-row"><span>S\u1ed1 l\u01b0\u1ee3ng</span><strong>' +
      escapeHtml(getQuantityLabel(summary.count)) +
      "</strong></div>" +
      '<div class="cart-summary-row"><span>T\u1ea1m t\u00ednh</span><strong>' +
      formatPrice(summary.subtotal) +
      "</strong></div>" +
      '<div class="cart-summary-row"><span>Ph\u00ed v\u1eadn chuy\u1ec3n</span><strong>T\u1ea1m t\u00ednh sau</strong></div>' +
      '<div class="cart-summary-row"><span>T\u1ed5ng c\u1ed9ng</span><strong>' +
      formatPrice(summary.subtotal) +
      "</strong></div>" +
      '<p class="cart-summary-note">Gi\u1ecf h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c l\u01b0u tr\u00ean server. Ph\u1ea7n mua h\u00e0ng v\u00e0 thanh to\u00e1n m\u00ecnh s\u1ebd l\u00e0m ti\u1ebfp sau.</p>' +
      '<div class="cart-summary-actions">' +
      '<button class="cart-disabled-btn" type="button" disabled>Ch\u01b0a m\u1edf thanh to\u00e1n</button>' +
      '<a class="cart-link-btn cart-link-btn--ghost" href="/">Ti\u1ebfp t\u1ee5c xem s\u1ea3n ph\u1ea9m</a>' +
      "</div>" +
      "</section>"
    );
  }

  function renderLoadingState() {
    container.innerHTML = '<div class="hp-loading"><div class="hp-spinner"></div></div>';
  }

  function renderEmptyState() {
    container.innerHTML =
      '<section class="cart-empty">' +
      buildAlertHtml() +
      "<h1>Gi\u1ecf h\u00e0ng \u0111ang tr\u1ed1ng</h1>" +
      "<p>B\u1ea1n ch\u01b0a th\u00eam s\u1ea3n ph\u1ea9m n\u00e0o. H\u00e3y ch\u1ecdn m\u1ed9t m\u00f3n trong danh s\u00e1ch \u0111\u1ec3 b\u1eaft \u0111\u1ea7u.</p>" +
      '<a class="cart-link-btn" href="/">Xem s\u1ea3n ph\u1ea9m</a>' +
      "</section>";
  }

  function renderErrorState(message) {
    container.innerHTML =
      '<section class="cart-empty">' +
      '<p class="cart-alert cart-alert--error">' +
      escapeHtml(message || "Kh\u00f4ng th\u1ec3 m\u1edf gi\u1ecf h\u00e0ng l\u00fac n\u00e0y.") +
      "</p>" +
      "<h1>Kh\u00f4ng th\u1ec3 m\u1edf gi\u1ecf h\u00e0ng</h1>" +
      "<p>Vui l\u00f2ng th\u1eed l\u1ea1i sau.</p>" +
      '<a class="cart-link-btn" href="/">Quay l\u1ea1i trang ch\u1ee7</a>' +
      "</section>";
  }

  function draw(summary) {
    var safeSummary = summary && typeof summary === "object" ? summary : { items: [], count: 0, subtotal: 0 };
    var items = Array.isArray(safeSummary.items) ? safeSummary.items : [];

    document.title = items.length
      ? "Gi\u1ecf h\u00e0ng (" + safeSummary.count + ") - gatecat.net"
      : "Gi\u1ecf h\u00e0ng - gatecat.net";

    if (!items.length) {
      renderEmptyState();
      return;
    }

    container.innerHTML =
      '<div class="cart-shell">' +
      '<a class="cart-back" href="/">&larr; Ti\u1ebfp t\u1ee5c mua s\u1eafm</a>' +
      buildAlertHtml() +
      '<div class="cart-header">' +
      "<div>" +
      '<h1 class="cart-title">Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n</h1>' +
      '<p class="cart-subtitle">Hi\u1ec7n c\u00f3 ' +
      escapeHtml(getQuantityLabel(safeSummary.count)) +
      " trong gi\u1ecf.</p>" +
      "</div>" +
      '<button class="cart-clear" type="button" data-clear-cart>X\u00f3a to\u00e0n b\u1ed9</button>' +
      "</div>" +
      '<div class="cart-layout">' +
      '<section class="cart-list">' +
      items.map(buildItemHtml).join("") +
      "</section>" +
      buildSummaryHtml(safeSummary) +
      "</div>" +
      "</div>";
  }

  function handleResult(result, fallbackErrorMessage) {
    if (result && result.ok) {
      setFeedback(result.message || "", "success");
      draw(result.cart || getCartSnapshot());
      return;
    }

    setFeedback(
      (result && result.message) || fallbackErrorMessage || "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt gi\u1ecf h\u00e0ng.",
      "error"
    );
    draw((result && result.cart) || getCartSnapshot());
  }

  function loadCart(force) {
    var cartApi = getCartApi();
    if (!cartApi) {
      renderErrorState();
      return;
    }

    renderLoadingState();
    cartApi
      .load(force)
      .then(function (summary) {
        draw(summary);
      })
      .catch(function (error) {
        renderErrorState(error && error.message);
      });
  }

  container.addEventListener("click", function (event) {
    var cartApi = getCartApi();
    if (!cartApi) return;

    var itemEl = event.target.closest("[data-product-id]");
    var productId = itemEl ? itemEl.getAttribute("data-product-id") : null;

    if (event.target.closest("[data-clear-cart]")) {
      cartApi.clear().then(function (result) {
        handleResult(result, "Kh\u00f4ng th\u1ec3 x\u00f3a gi\u1ecf h\u00e0ng.");
      });
      return;
    }

    if (event.target.closest("[data-remove-item]") && productId) {
      cartApi.remove(productId).then(function (result) {
        handleResult(result, "Kh\u00f4ng th\u1ec3 x\u00f3a s\u1ea3n ph\u1ea9m.");
      });
      return;
    }

    if (!itemEl || !productId) {
      return;
    }

    var input = itemEl.querySelector("[data-qty-input]");
    var maxQuantity = Number(input && input.max);
    var currentQuantity = sanitizeQuantity(input && input.value, maxQuantity);

    if (event.target.closest("[data-qty-dec]")) {
      cartApi.updateQuantity(productId, Math.max(1, currentQuantity - 1)).then(function (result) {
        handleResult(result, "Kh\u00f4ng th\u1ec3 gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng.");
      });
      return;
    }

    if (event.target.closest("[data-qty-inc]")) {
      cartApi
        .updateQuantity(productId, sanitizeQuantity(currentQuantity + 1, maxQuantity))
        .then(function (result) {
          handleResult(result, "Kh\u00f4ng th\u1ec3 t\u0103ng s\u1ed1 l\u01b0\u1ee3ng.");
        });
    }
  });

  container.addEventListener("change", function (event) {
    var input = event.target.closest("[data-qty-input]");
    if (!input) return;

    var itemEl = input.closest("[data-product-id]");
    if (!itemEl) return;

    var cartApi = getCartApi();
    if (!cartApi) return;

    var productId = itemEl.getAttribute("data-product-id");
    var nextQuantity = sanitizeQuantity(input.value, Number(input.max));

    cartApi.updateQuantity(productId, nextQuantity).then(function (result) {
      handleResult(result, "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt s\u1ed1 l\u01b0\u1ee3ng.");
    });
  });

  if (window.GateCatCart && window.GateCatCart.eventName) {
    window.addEventListener(window.GateCatCart.eventName, function (event) {
      if (event && event.detail) {
        draw(event.detail);
      }
    });
  }

  loadCart(false);
})();
