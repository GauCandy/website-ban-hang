(function () {
  var container = document.getElementById("search-results");
  var heading = document.getElementById("search-heading");
  if (!container) return;

  var params = new URLSearchParams(window.location.search);
  var query = (params.get("q") || "").trim();

  // Pre-fill search input in header
  var headerInput = document.querySelector(".header-search-input");
  if (headerInput && query) headerInput.value = query;

  if (!query) {
    heading.innerHTML = "Tìm kiếm";
    container.innerHTML = '<p class="hp-empty">Nhập từ khóa để tìm kiếm sản phẩm.</p>';
    return;
  }

  heading.innerHTML = 'Kết quả cho "<span>' + escapeHtml(query) + '</span>"';

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

  container.innerHTML = '<div class="hp-loading"><div class="hp-spinner"></div></div>';

  fetch("/api/products?status=active&limit=60&search=" + encodeURIComponent(query), {
    headers: { Accept: "application/json" }
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        container.innerHTML = '<p class="hp-empty">Không tìm thấy sản phẩm nào.</p>';
        return;
      }

      var grid = '<div class="hp-grid">';
      items.forEach(function (p) {
        var img = p.cover_image_url
          ? '<img class="hp-card-img" src="' + escapeHtml(p.cover_image_url) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" />'
          : '<div class="hp-card-img hp-card-img--empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';

        var priceHtml = '<span class="hp-card-price">' + formatPrice(p.price) + "</span>";
        if (p.compare_at_price && p.compare_at_price > p.price) {
          priceHtml += '<del class="hp-card-compare">' + formatPrice(p.compare_at_price) + "</del>";
        }

        var discountBadge = p.discount_percent > 0
          ? '<span class="hp-card-discount">-' + p.discount_percent + "%</span>"
          : "";

        var stockLabel = !p.is_in_stock
          ? '<span class="hp-card-soldout">Hết hàng</span>'
          : "";

        grid +=
          '<a class="hp-card" href="/product/' + encodeURIComponent(p.slug || p.id) + '">' +
          '<div class="hp-card-visual">' + img + discountBadge + stockLabel + "</div>" +
          '<div class="hp-card-body">' +
          '<p class="hp-card-name">' + escapeHtml(p.name) + "</p>" +
          '<div class="hp-card-prices">' + priceHtml + "</div>" +
          "</div></a>";
      });
      grid += "</div>";
      container.innerHTML = grid;
    })
    .catch(function () {
      container.innerHTML = '<p class="hp-empty">Đã xảy ra lỗi khi tìm kiếm.</p>';
    });
})();
