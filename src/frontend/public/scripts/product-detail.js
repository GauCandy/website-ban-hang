(function () {
  var container = document.getElementById("product-detail");
  if (!container) return;

  var parts = window.location.pathname.split("/");
  var slug = decodeURIComponent(parts[2] || "");
  if (!slug) {
    container.innerHTML = '<p class="pd-error">Không tìm thấy sản phẩm.</p>';
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

  fetch("/api/products/" + encodeURIComponent(slug), {
    headers: { Accept: "application/json" }
  })
    .then(function (r) {
      if (!r.ok) throw new Error("not found");
      return r.json();
    })
    .then(function (data) {
      var p = data.product;
      if (!p) throw new Error("no product");

      document.title = p.name + " — gatecat.net";

      var allImages = [];
      if (p.cover_image_url) allImages.push(p.cover_image_url);
      if (Array.isArray(p.images)) {
        p.images.forEach(function (url) {
          if (url && allImages.indexOf(url) === -1) allImages.push(url);
        });
      }

      var galleryHtml = "";
      if (allImages.length) {
        galleryHtml += '<div class="pd-gallery">';
        galleryHtml += '<img class="pd-main-img" id="pd-main-img" src="' + escapeHtml(allImages[0]) + '" alt="' + escapeHtml(p.name) + '" />';
        if (allImages.length > 1) {
          galleryHtml += '<div class="pd-thumbs">';
          allImages.forEach(function (url, i) {
            galleryHtml += '<img class="pd-thumb' + (i === 0 ? " is-active" : "") + '" src="' + escapeHtml(url) + '" data-idx="' + i + '" alt="" />';
          });
          galleryHtml += "</div>";
        }
        galleryHtml += "</div>";
      } else {
        galleryHtml = '<div class="pd-gallery pd-gallery--empty"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
      }

      var priceHtml = '<span class="pd-price">' + formatPrice(p.price) + "</span>";
      if (p.compare_at_price && p.compare_at_price > p.price) {
        priceHtml += '<del class="pd-compare">' + formatPrice(p.compare_at_price) + "</del>";
        priceHtml += '<span class="pd-discount">-' + p.discount_percent + "%</span>";
      }

      var stockHtml = p.is_in_stock
        ? '<span class="pd-stock pd-stock--in">Còn hàng</span>'
        : '<span class="pd-stock pd-stock--out">Hết hàng</span>';

      var categoryHtml = p.category_name
        ? '<span class="pd-category">' + escapeHtml(p.category_name) + "</span>"
        : "";

      var descHtml = p.description
        ? '<div class="pd-section"><h3 class="pd-section-title">Mô tả sản phẩm</h3><div class="pd-desc">' + p.description + "</div></div>"
        : "";

      var shortDescHtml = p.short_description
        ? '<p class="pd-short-desc">' + escapeHtml(p.short_description) + "</p>"
        : "";

      container.innerHTML =
        '<div class="pd-inner">' +
        '<a class="pd-back" href="/">&larr; Quay lại</a>' +
        '<div class="pd-layout">' +
        galleryHtml +
        '<div class="pd-info">' +
        categoryHtml +
        '<h1 class="pd-name">' + escapeHtml(p.name) + "</h1>" +
        shortDescHtml +
        '<div class="pd-prices">' + priceHtml + "</div>" +
        stockHtml +
        (p.sku ? '<p class="pd-sku">SKU: ' + escapeHtml(p.sku) + "</p>" : "") +
        "</div>" +
        "</div>" +
        descHtml +
        "</div>";

      // Thumbnail click handler
      var mainImg = document.getElementById("pd-main-img");
      var thumbs = container.querySelectorAll(".pd-thumb");
      if (mainImg && thumbs.length) {
        container.addEventListener("click", function (e) {
          var thumb = e.target.closest(".pd-thumb");
          if (!thumb) return;
          mainImg.src = thumb.src;
          thumbs.forEach(function (t) { t.classList.remove("is-active"); });
          thumb.classList.add("is-active");
        });
      }
    })
    .catch(function () {
      container.innerHTML = '<div class="pd-error"><h2>Không tìm thấy sản phẩm</h2><p>Sản phẩm này không tồn tại hoặc đã bị xóa.</p><a class="pd-back" href="/">&larr; Quay lại trang chủ</a></div>';
    });
})();
