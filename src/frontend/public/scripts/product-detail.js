(function () {
  var container = document.getElementById("product-detail");
  if (!container) return;

  var parts = window.location.pathname.split("/");
  var slug = decodeURIComponent(parts[2] || "");
  if (!slug) {
    container.innerHTML = '<p class="pd-error">Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m.</p>';
    return;
  }

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

  function getMaxPurchaseQuantity(product) {
    if (!product) return 1;
    if (product.track_inventory === false) return 99;

    var stock = Number(product.stock_quantity);
    if (!Number.isFinite(stock) || stock === -1) return 99;
    return Math.max(1, stock);
  }

  function buildGalleryHtml(images, name) {
    if (!images.length) {
      return '<div class="pd-gallery pd-gallery--empty"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
    }

    var html = '<div class="pd-gallery">';
    html += '<img class="pd-main-img" id="pd-main-img" src="' + escapeHtml(images[0]) + '" alt="' + escapeHtml(name) + '" />';

    if (images.length > 1) {
      html += '<div class="pd-thumbs">';
      images.forEach(function (url, index) {
        html += '<img class="pd-thumb' + (index === 0 ? " is-active" : "") + '" src="' + escapeHtml(url) + '" data-idx="' + index + '" alt="" />';
      });
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  function buildActionsHtml(product) {
    var maxPurchaseQuantity = getMaxPurchaseQuantity(product);

    return (
      '<div class="pd-actions">' +
        '<div class="pd-qty" data-qty-control>' +
          '<button class="pd-qty-btn" type="button" data-qty-dec aria-label="Gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng">-</button>' +
          '<input class="pd-qty-input" type="number" min="1" max="' + maxPurchaseQuantity + '" value="1" data-cart-qty />' +
          '<button class="pd-qty-btn" type="button" data-qty-inc aria-label="T\u0103ng s\u1ed1 l\u01b0\u1ee3ng">+</button>' +
        "</div>" +
        '<button class="pd-add-cart" type="button" data-add-to-cart' + (product.is_in_stock ? "" : " disabled") + '>\u0054h\u00eam v\u00e0o gi\u1ecf h\u00e0ng</button>' +
        '<a class="pd-view-cart" href="/cart">\u0058em gi\u1ecf h\u00e0ng</a>' +
      "</div>" +
      '<p class="pd-cart-feedback" data-cart-feedback hidden></p>'
    );
  }

  fetch("/api/products/" + encodeURIComponent(slug), {
    headers: { Accept: "application/json" }
  })
    .then(function (response) {
      if (!response.ok) throw new Error("not_found");
      return response.json();
    })
    .then(function (data) {
      var product = data.product;
      if (!product) throw new Error("missing_product");

      document.title = product.name + " - gatecat.net";

      var allImages = [];
      if (product.cover_image_url) allImages.push(product.cover_image_url);
      if (Array.isArray(product.images)) {
        product.images.forEach(function (url) {
          if (url && allImages.indexOf(url) === -1) allImages.push(url);
        });
      }

      var priceHtml = '<span class="pd-price">' + formatPrice(product.price) + "</span>";
      if (product.compare_at_price && product.compare_at_price > product.price) {
        priceHtml += '<del class="pd-compare">' + formatPrice(product.compare_at_price) + "</del>";
        priceHtml += '<span class="pd-discount">-' + product.discount_percent + "%</span>";
      }

      var stockHtml = product.is_in_stock
        ? '<span class="pd-stock pd-stock--in">C\u00f2n h\u00e0ng</span>'
        : '<span class="pd-stock pd-stock--out">H\u1ebft h\u00e0ng</span>';

      var categoryHtml = product.category_name
        ? '<span class="pd-category">' + escapeHtml(product.category_name) + "</span>"
        : "";

      var descHtml = product.description
        ? '<div class="pd-section"><h3 class="pd-section-title">M\u00f4 t\u1ea3 s\u1ea3n ph\u1ea9m</h3><div class="pd-desc">' + product.description + "</div></div>"
        : "";

      var shortDescHtml = product.short_description
        ? '<p class="pd-short-desc">' + escapeHtml(product.short_description) + "</p>"
        : "";

      container.innerHTML =
        '<div class="pd-inner">' +
          '<a class="pd-back" href="/">&larr; Quay l\u1ea1i</a>' +
          '<div class="pd-layout">' +
            buildGalleryHtml(allImages, product.name) +
            '<div class="pd-info">' +
              categoryHtml +
              '<h1 class="pd-name">' + escapeHtml(product.name) + "</h1>" +
              shortDescHtml +
              '<div class="pd-prices">' + priceHtml + "</div>" +
              stockHtml +
              (product.sku ? '<p class="pd-sku">SKU: ' + escapeHtml(product.sku) + "</p>" : "") +
              buildActionsHtml(product) +
            "</div>" +
          "</div>" +
          descHtml +
        "</div>";

      var maxPurchaseQuantity = getMaxPurchaseQuantity(product);
      var mainImg = container.querySelector("#pd-main-img");
      var thumbs = container.querySelectorAll(".pd-thumb");
      var qtyInput = container.querySelector("[data-cart-qty]");
      var feedbackEl = container.querySelector("[data-cart-feedback]");
      var addToCartButton = container.querySelector("[data-add-to-cart]");

      function showFeedback(message, type) {
        if (!feedbackEl) return;
        feedbackEl.textContent = message;
        feedbackEl.className = "pd-cart-feedback " + (type === "error" ? "is-error" : "is-success");
        feedbackEl.hidden = false;
      }

      function clampQuantity() {
        if (!qtyInput) return 1;
        var nextValue = Number(qtyInput.value || 1);
        if (!Number.isFinite(nextValue)) nextValue = 1;
        nextValue = Math.max(1, Math.min(maxPurchaseQuantity, Math.round(nextValue)));
        qtyInput.value = String(nextValue);
        return nextValue;
      }

      if (qtyInput) {
        qtyInput.addEventListener("input", clampQuantity);
      }

      container.addEventListener("click", function (event) {
        var thumb = event.target.closest(".pd-thumb");
        if (thumb && mainImg) {
          mainImg.src = thumb.src;
          thumbs.forEach(function (item) { item.classList.remove("is-active"); });
          thumb.classList.add("is-active");
          return;
        }

        if (event.target.closest("[data-qty-dec]") && qtyInput) {
          qtyInput.value = String(Math.max(1, clampQuantity() - 1));
          return;
        }

        if (event.target.closest("[data-qty-inc]") && qtyInput) {
          qtyInput.value = String(Math.min(maxPurchaseQuantity, clampQuantity() + 1));
          return;
        }

        if (event.target.closest("[data-add-to-cart]")) {
          if (!window.GateCatCart) {
            showFeedback("Kh\u00f4ng th\u1ec3 th\u00eam v\u00e0o gi\u1ecf l\u00fac n\u00e0y.", "error");
            return;
          }

          if (addToCartButton) {
            addToCartButton.disabled = true;
          }

          window.GateCatCart
            .add(product, clampQuantity())
            .then(function (result) {
              if (result && result.ok && result.adjusted) {
                showFeedback("Gi\u1ecf h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt theo gi\u1edbi h\u1ea1n t\u1ed3n kho.", "success");
              } else if (result && result.ok) {
                showFeedback("\u0110\u00e3 th\u00eam s\u1ea3n ph\u1ea9m v\u00e0o gi\u1ecf h\u00e0ng.", "success");
              } else if (result && result.reason === "limit_reached") {
                showFeedback("S\u1ed1 l\u01b0\u1ee3ng \u0111\u00e3 \u0111\u1ea1t gi\u1edbi h\u1ea1n t\u1ed3n kho.", "error");
              } else if (result && result.reason === "out_of_stock") {
                showFeedback("S\u1ea3n ph\u1ea9m hi\u1ec7n \u0111ang h\u1ebft h\u00e0ng.", "error");
              } else {
                showFeedback(
                  (result && result.message) || "Kh\u00f4ng th\u1ec3 th\u00eam v\u00e0o gi\u1ecf l\u00fac n\u00e0y.",
                  "error"
                );
              }
            })
            .catch(function () {
              showFeedback("Kh\u00f4ng th\u1ec3 th\u00eam v\u00e0o gi\u1ecf l\u00fac n\u00e0y.", "error");
            })
            .finally(function () {
              if (addToCartButton) {
                addToCartButton.disabled = !product.is_in_stock;
              }
            });
        }
      });
    })
    .catch(function () {
      container.innerHTML = '<div class="pd-error"><h2>Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m</h2><p>S\u1ea3n ph\u1ea9m n\u00e0y kh\u00f4ng t\u1ed3n t\u1ea1i ho\u1eb7c \u0111\u00e3 b\u1ecb x\u00f3a.</p><a class="pd-back" href="/">&larr; Quay l\u1ea1i trang ch\u1ee7</a></div>';
    });
})();
