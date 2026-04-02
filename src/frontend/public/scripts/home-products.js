(function () {
  var container = document.getElementById("home-products");
  if (!container) return;

  var state = {
    products: [],
    categories: [],
    activeCategory: "all",
    loading: true
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

  function getFilteredProducts() {
    if (state.activeCategory === "all") return state.products;
    return state.products.filter(function (p) {
      return p.category_id === state.activeCategory;
    });
  }

  function render() {
    if (state.loading) {
      container.innerHTML =
        '<div class="hp-loading"><div class="hp-spinner"></div></div>';
      return;
    }

    if (!state.products.length) {
      container.innerHTML =
        '<p class="hp-empty">Chưa có sản phẩm nào.</p>';
      return;
    }

    var catBar = '<div class="hp-cat-bar"><div class="hp-cat-scroll">';
    catBar +=
      '<button class="hp-cat-chip' +
      (state.activeCategory === "all" ? " is-active" : "") +
      '" data-cat="all">Tất cả</button>';
    state.categories.forEach(function (c) {
      catBar +=
        '<button class="hp-cat-chip' +
        (state.activeCategory === c.id ? " is-active" : "") +
        '" data-cat="' +
        escapeHtml(c.id) +
        '">' +
        escapeHtml(c.name) +
        "</button>";
    });
    catBar += "</div></div>";

    var filtered = getFilteredProducts();
    var grid = '<div class="hp-grid">';
    filtered.forEach(function (p) {
      var img = p.cover_image_url
        ? '<img class="hp-card-img" src="' +
          escapeHtml(p.cover_image_url) +
          '" alt="' +
          escapeHtml(p.name) +
          '" loading="lazy" />'
        : '<div class="hp-card-img hp-card-img--empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';

      var priceHtml = '<span class="hp-card-price">' + formatPrice(p.price) + "</span>";
      if (p.compare_at_price && p.compare_at_price > p.price) {
        priceHtml +=
          '<del class="hp-card-compare">' +
          formatPrice(p.compare_at_price) +
          "</del>";
      }

      var discountBadge = "";
      if (p.discount_percent > 0) {
        discountBadge = '<span class="hp-card-discount">-' + p.discount_percent + "%</span>";
      }
      var hotBadge = p.is_featured ? '<span class="hp-card-hot">🔥 HOT</span>' : "";

      var stockLabel = "";
      if (!p.is_in_stock) {
        stockLabel = '<span class="hp-card-soldout">Hết hàng</span>';
      }

      grid +=
        '<a class="hp-card" href="/product/' + encodeURIComponent(p.slug || p.id) + '">' +
        '<div class="hp-card-visual">' +
        img +
        discountBadge +
        stockLabel +
        "</div>" +
        '<div class="hp-card-body">' +
        '<p class="hp-card-name">' +
        escapeHtml(p.name) +
        "</p>" +
        '<div class="hp-card-prices">' +
        priceHtml +
        "</div>" +
        hotBadge +
        "</div>" +
        "</a>";
    });
    grid += "</div>";

    if (!filtered.length) {
      grid =
        '<p class="hp-empty">Không có sản phẩm nào trong danh mục này.</p>';
    }

    container.innerHTML = catBar + grid;
  }

  container.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-cat]");
    if (!chip) return;
    state.activeCategory = chip.getAttribute("data-cat");
    render();
  });

  fetch("/api/products?status=active&limit=60", {
    headers: { Accept: "application/json" }
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      state.products = Array.isArray(data.items) ? data.items : [];
      // Extract unique categories
      var seen = {};
      state.products.forEach(function (p) {
        if (p.category_id && !seen[p.category_id]) {
          seen[p.category_id] = true;
          state.categories.push({
            id: p.category_id,
            name: p.category_name || "Khác"
          });
        }
      });
      state.loading = false;
      render();
    })
    .catch(function () {
      state.loading = false;
      render();
    });
})();
