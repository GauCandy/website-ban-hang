(function () {
  const root = document.querySelector("[data-admin-root]");

  if (!root) {
    return;
  }

  const state = {
    user: null,
    products: [],
    categories: [],
    modalOpen: false,
    editingProductId: null,
    productForm: createEmptyProductForm(),
    productFeedback: null,
    images: [],
    categorySearch: "",
    categoryDropdownOpen: false,
    searchQuery: "",
    filterStatus: "all",
    filterCategory: "all",
    filterStock: "all",
    filterFeatured: "all",
    filtersOpen: false,
    submitting: false,
    currentPage: 1,
    perPage: 20
  };

  var persistentFileInput = document.createElement("input");
  persistentFileInput.type = "file";
  persistentFileInput.accept = "image/*";
  persistentFileInput.multiple = true;
  persistentFileInput.style.display = "none";
  document.body.appendChild(persistentFileInput);

  persistentFileInput.addEventListener("change", function () {
    var files = persistentFileInput.files ? Array.from(persistentFileInput.files) : [];
    if (!files.length) return;

    Promise.all(files.map(function (file) {
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () {
          resolve({ file: file, dataUrl: typeof reader.result === "string" ? reader.result : "" });
        };
        reader.readAsDataURL(file);
      });
    })).then(function (entries) {
      entries.forEach(function (entry) {
        if (entry.dataUrl) state.images.push({ type: "pending", file: entry.file, dataUrl: entry.dataUrl });
      });
      persistentFileInput.value = "";
      render();
    });
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character;
    });
  }

  function parseJson(response) {
    return response.json().catch(function () { return null; });
  }

  function parseJsonWithResponse(response) {
    return parseJson(response).then(function (payload) {
      if (!response.ok) {
        throw new Error(payload?.message || "Yêu cầu không thành công.");
      }
      return payload;
    });
  }

  function createEmptyProductForm() {
    return {
      name: "",
      category_id: "",
      category_name: "",
      description: "",
      price: "",
      compare_at_price: "",
      stock_quantity: "0",
      product_status: "draft",
      track_inventory: true,
      is_featured: false
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function getStatusLabel(status) {
    if (status === "active") return "Đang bán";
    if (status === "archived") return "Lưu trữ";
    return "Bản nháp";
  }

  function getStatusChip(status) {
    if (status === "active") {
      return '<span class="admin-status-chip is-success">Đang bán</span>';
    }
    if (status === "archived") {
      return '<span class="admin-status-chip is-muted">Lưu trữ</span>';
    }
    return '<span class="admin-status-chip">Bản nháp</span>';
  }

  function getStockChip(stockQuantity) {
    var quantity = Number(stockQuantity);
    if (quantity === -1) {
      return '<span class="admin-status-chip is-muted">Không giới hạn</span>';
    }
    if (quantity === 0) {
      return '<span class="admin-status-chip is-danger">Hết hàng</span>';
    }
    if (quantity <= 5) {
      return '<span class="admin-status-chip is-warning">Sắp hết (' + quantity + ")</span>";
    }
    return '<span class="admin-status-chip is-muted">' + quantity + "</span>";
  }

  function buildFeedback(feedback) {
    if (!feedback?.message) return "";
    return '<p class="admin-feedback ' + (feedback.type === "error" ? "is-error" : "is-success") + '">' + escapeHtml(feedback.message) + "</p>";
  }

  async function fetchCurrentUser() {
    var response = await fetch("/api/users/me", { credentials: "same-origin", headers: { Accept: "application/json" } });
    if (response.status === 401) return null;
    var payload = await parseJson(response);
    if (!response.ok) throw new Error(payload?.message || "Không tải được thông tin tài khoản.");
    return payload?.user || null;
  }

  async function fetchCategories() {
    var response = await fetch("/api/admin/categories", { credentials: "same-origin", headers: { Accept: "application/json" } });
    var payload = await parseJson(response);
    if (!response.ok) throw new Error(payload?.message || "Không tải được danh mục.");
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async function fetchAdminProducts() {
    var response = await fetch("/api/admin/products", { credentials: "same-origin", headers: { Accept: "application/json" } });
    var payload = await parseJson(response);
    if (!response.ok) throw new Error(payload?.message || "Không tải được danh sách sản phẩm.");
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async function reloadAdminData() {
    var results = await Promise.all([fetchCategories(), fetchAdminProducts()]);
    state.categories = results[0];
    state.products = results[1];
  }

  function getFilteredProducts() {
    return state.products.filter(function (product) {
      if (state.filterStatus !== "all" && product.product_status !== state.filterStatus) return false;
      if (state.filterCategory === "none" && product.category_id) return false;
      if (state.filterCategory !== "all" && state.filterCategory !== "none" && product.category_id !== state.filterCategory) return false;
      if (state.filterStock === "out" && Number(product.stock_quantity) !== 0) return false;
      if (state.filterStock === "low" && (Number(product.stock_quantity) === -1 || Number(product.stock_quantity) > 5)) return false;
      if (state.filterStock === "unlimited" && Number(product.stock_quantity) !== -1) return false;
      if (state.filterFeatured === "hot" && !product.is_featured) return false;
      if (state.filterFeatured === "normal" && product.is_featured) return false;
      if (state.searchQuery) {
        var query = state.searchQuery.toLowerCase();
        var matchesName = String(product.name || "").toLowerCase().includes(query);
        var matchesCategory = String(product.category_name || "").toLowerCase().includes(query);
        var matchesSku = String(product.sku || "").toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesSku) return false;
      }
      return true;
    });
  }

  function buildCategoryCombobox() {
    var query = state.categorySearch.toLowerCase();
    var filtered = query
      ? state.categories.filter(function (c) { return c.name.toLowerCase().includes(query); })
      : state.categories;
    var exactMatch = state.categories.some(function (c) { return c.name.toLowerCase() === query; });
    var showCreate = query && !exactMatch;
    var selectedCategory = state.productForm.category_id
      ? state.categories.find(function (c) { return c.id === state.productForm.category_id; })
      : null;
    var inputValue = selectedCategory ? selectedCategory.name : state.categorySearch;

    var dropdownHtml = "";
    if (state.categoryDropdownOpen && (filtered.length || showCreate)) {
      dropdownHtml = '<div class="admin-combobox-dropdown">';
      dropdownHtml += '<button class="admin-combobox-option" type="button" data-category-select-none>Chưa phân loại</button>';
      filtered.forEach(function (c) {
        dropdownHtml += '<button class="admin-combobox-option" type="button" data-category-select="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + "</button>";
      });
      if (showCreate) {
        dropdownHtml += '<button class="admin-combobox-option is-create" type="button" data-category-create="' + escapeHtml(state.categorySearch) + '">Tạo danh mục "' + escapeHtml(state.categorySearch) + '"</button>';
      }
      dropdownHtml += "</div>";
    }

    return '<div class="admin-field"><label for="product-category">Danh mục</label><div class="admin-combobox"><input class="admin-input" id="product-category" autocomplete="off" placeholder="Nhập để tìm hoặc tạo danh mục..." value="' + escapeHtml(inputValue) + '" />' + dropdownHtml + "</div></div>";
  }

  function buildProductsToolbar() {
    var uniqueCategories = [];
    var seen = {};
    state.products.forEach(function (p) {
      if (p.category_id && !seen[p.category_id]) {
        seen[p.category_id] = true;
        uniqueCategories.push({ id: p.category_id, name: p.category_name || "Không tên" });
      }
    });

    var outOfStock = state.products.filter(function (p) { return Number(p.stock_quantity) === 0; }).length;
    var activeCount = state.products.filter(function (p) { return p.product_status === "active"; }).length;
    var hotCount = state.products.filter(function (p) { return !!p.is_featured; }).length;

    var hasActiveFilters =
      state.filterStatus !== "all" ||
      state.filterCategory !== "all" ||
      state.filterStock !== "all" ||
      state.filterFeatured !== "all";
    var filtered = getFilteredProducts();

    return '<div class="admin-toolbar"><div class="admin-toolbar-left"><h3 class="admin-section-title">Sản phẩm</h3><div class="admin-toolbar-stats"><span class="admin-stat">' + state.products.length + ' sản phẩm</span><span class="admin-stat is-success">' + activeCount + ' đang bán</span>' + (outOfStock > 0 ? '<span class="admin-stat is-danger">' + outOfStock + ' hết hàng</span>' : '') + '</div></div><button class="admin-button" type="button" data-open-modal>+ Thêm sản phẩm</button></div>' +
      '<div class="admin-filters-bar">' +
        '<div class="admin-search-wrap"><svg class="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="admin-input admin-search-input" type="text" placeholder="Tìm theo tên, SKU, danh mục..." value="' + escapeHtml(state.searchQuery) + '" data-search-input /></div>' +
        '<button class="admin-filter-toggle' + (hasActiveFilters ? ' is-active' : '') + '" type="button" data-toggle-filters><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Lọc' + (hasActiveFilters ? ' (' + filtered.length + ')' : '') + '</button>' +
        (hasActiveFilters ? '<button class="admin-filter-clear" type="button" data-clear-filters>Xóa bộ lọc</button>' : '') +
      '</div>' +
      '<div class="admin-filters-panel' + (state.filtersOpen ? ' is-open' : '') + '" data-filters-panel>' +
        '<div class="admin-filter-section"><span class="admin-filter-label">Trạng thái</span><div class="admin-filter-chips">' +
          '<button class="admin-filter-chip' + (state.filterStatus === "all" ? ' is-active' : '') + '" type="button" data-filter-status-chip="all">Tất cả</button>' +
          '<button class="admin-filter-chip' + (state.filterStatus === "active" ? ' is-active' : '') + '" type="button" data-filter-status-chip="active">Đang bán</button>' +
          '<button class="admin-filter-chip' + (state.filterStatus === "draft" ? ' is-active' : '') + '" type="button" data-filter-status-chip="draft">Bản nháp</button>' +
          '<button class="admin-filter-chip' + (state.filterStatus === "archived" ? ' is-active' : '') + '" type="button" data-filter-status-chip="archived">Lưu trữ</button>' +
        '</div></div>' +
        '<div class="admin-filter-section"><span class="admin-filter-label">Danh mục</span><div class="admin-filter-chips">' +
          '<button class="admin-filter-chip' + (state.filterCategory === "all" ? ' is-active' : '') + '" type="button" data-filter-category-chip="all">Tất cả</button>' +
          '<button class="admin-filter-chip' + (state.filterCategory === "none" ? ' is-active' : '') + '" type="button" data-filter-category-chip="none">Chưa phân loại</button>' +
          uniqueCategories.map(function (c) { return '<button class="admin-filter-chip' + (state.filterCategory === c.id ? ' is-active' : '') + '" type="button" data-filter-category-chip="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</button>'; }).join("") +
        '</div></div>' +
        '<div class="admin-filter-section"><span class="admin-filter-label">Tồn kho</span><div class="admin-filter-chips">' +
          '<button class="admin-filter-chip' + (state.filterStock === "all" ? ' is-active' : '') + '" type="button" data-filter-stock-chip="all">Tất cả</button>' +
          '<button class="admin-filter-chip' + (state.filterStock === "out" ? ' is-active' : '') + '" type="button" data-filter-stock-chip="out">Hết hàng</button>' +
          '<button class="admin-filter-chip' + (state.filterStock === "low" ? ' is-active' : '') + '" type="button" data-filter-stock-chip="low">Sắp hết (≤5)</button>' +
          '<button class="admin-filter-chip' + (state.filterStock === "unlimited" ? ' is-active' : '') + '" type="button" data-filter-stock-chip="unlimited">Không giới hạn</button>' +
        '</div></div>' +
      '</div>';
  }

  function buildProductsTable() {
    var filtered = getFilteredProducts();
    if (!filtered.length) {
      if (state.products.length) {
        return '<div class="admin-empty-card"><p>Không tìm thấy sản phẩm nào khớp bộ lọc.</p></div>';
      }
      return '<div class="admin-empty-card"><p>Chưa có sản phẩm nào. Nhấn <strong>+ Thêm sản phẩm</strong> để bắt đầu.</p></div>';
    }

    var totalPages = Math.ceil(filtered.length / state.perPage);
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    var start = (state.currentPage - 1) * state.perPage;
    var pageItems = filtered.slice(start, start + state.perPage);

    var tableHtml = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
      pageItems.map(function (p) {
        var coverHtml = p.cover_image_url
          ? '<img class="admin-table-thumb" src="' + escapeHtml(p.cover_image_url) + '" alt="" />'
          : '<div class="admin-table-thumb-placeholder"></div>';
        return '<tr data-product-row="' + p.id + '">' +
          '<td><div class="admin-product-cell">' + coverHtml + '<div><strong>' + escapeHtml(p.name) + '</strong>' + (p.sku ? '<span class="admin-sku">' + escapeHtml(p.sku) + '</span>' : '') + '</div></div></td>' +
          '<td>' + escapeHtml(p.category_name || "Chưa phân loại") + '</td>' +
          '<td>' + formatCurrency(p.price) + (p.compare_at_price && p.compare_at_price > p.price ? '<del class="admin-compare-price">' + formatCurrency(p.compare_at_price) + '</del>' : '') + '</td>' +
          '<td>' + getStockChip(p.stock_quantity) + '</td>' +
          '<td>' + getStatusChip(p.product_status) + '</td>' +
          '<td><div class="admin-row-actions"><button class="admin-icon-button" type="button" data-product-edit="' + p.id + '" title="Sửa sản phẩm">✏️</button><button class="admin-icon-button is-danger" type="button" data-product-delete="' + p.id + '" title="Xóa sản phẩm">🗑️</button></div></td>' +
          '</tr>';
      }).join("") +
      '</tbody></table></div>';

    if (totalPages <= 1) return tableHtml;

    var paginationHtml = '<div class="admin-pagination">' +
      '<button class="admin-page-btn" type="button" data-page="' + (state.currentPage - 1) + '"' + (state.currentPage <= 1 ? ' disabled' : '') + '>&lsaquo;</button>';
    for (var pg = 1; pg <= totalPages; pg++) {
      if (totalPages > 7 && pg > 2 && pg < totalPages - 1 && Math.abs(pg - state.currentPage) > 1) {
        if (pg === 3 || pg === totalPages - 2) paginationHtml += '<span class="admin-page-ellipsis">&hellip;</span>';
        continue;
      }
      paginationHtml += '<button class="admin-page-btn' + (pg === state.currentPage ? ' is-active' : '') + '" type="button" data-page="' + pg + '">' + pg + '</button>';
    }
    paginationHtml += '<button class="admin-page-btn" type="button" data-page="' + (state.currentPage + 1) + '"' + (state.currentPage >= totalPages ? ' disabled' : '') + '>&rsaquo;</button></div>';

    return tableHtml + paginationHtml;
  }

  function buildImagePreview() {
    var addTile = '<div class="admin-image-tile admin-image-add" data-add-images><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></div>';
    if (!state.images.length) {
      return '<div class="admin-image-grid">' + addTile + '</div>';
    }
    var html = '<div class="admin-image-grid">';
    state.images.forEach(function (img, i) {
      var isCover = i === 0;
      var src = img.type === "existing" ? escapeHtml(img.url) : escapeHtml(img.dataUrl);
      html += '<div class="admin-image-tile' + (isCover ? ' is-cover' : '') + '">' +
        '<img src="' + src + '" alt="Ảnh ' + (i + 1) + '" />' +
        '<button class="admin-image-remove" type="button" data-remove-image="' + i + '" title="Xóa ảnh">&times;</button>' +
        (isCover
          ? '<span class="admin-image-badge">Ảnh bìa</span>'
          : '<button class="admin-image-set-cover" type="button" data-set-cover="' + i + '" title="Đặt làm ảnh bìa">Đặt làm bìa</button>') +
        '</div>';
    });
    html += addTile + '</div>';
    return html;
  }

  function buildModal() {
    if (!state.modalOpen) return "";

    var isEditing = !!state.editingProductId;
    var title = isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm mới";
    var submitLabel = isEditing ? "Lưu thay đổi" : "Tạo sản phẩm";

    return '<div class="admin-modal-overlay" data-modal-overlay>' +
      '<div class="admin-modal"><div class="admin-modal-header"><h3 class="admin-form-title">' + title + '</h3><button class="admin-modal-close" type="button" data-close-modal>&times;</button></div>' +
      '<form class="admin-form" data-product-form>' +
      '<div class="admin-field-grid">' +
      '<div class="admin-field"><label for="product-name">Tên sản phẩm</label><input class="admin-input" id="product-name" name="name" value="' + escapeHtml(state.productForm.name) + '" required /></div>' +
      buildCategoryCombobox() +
      '<div class="admin-field"><label for="product-price">Giá bán</label><input class="admin-input" id="product-price" name="price" type="number" min="0" step="1000" value="' + escapeHtml(state.productForm.price) + '" required /></div>' +
      '<div class="admin-field"><label for="product-compare-price">Giá niêm yết</label><input class="admin-input" id="product-compare-price" name="compare_at_price" type="number" min="0" step="1000" value="' + escapeHtml(state.productForm.compare_at_price) + '" /></div>' +
      '<div class="admin-field"><label for="product-stock">Số lượng tồn</label><div class="admin-input-with-hint"><input class="admin-input" id="product-stock" name="stock_quantity" type="number" min="-1" step="1" value="' + escapeHtml(state.productForm.stock_quantity) + '" /><span class="admin-helper">-1 = không giới hạn</span></div></div>' +
      '<div class="admin-field"><label for="product-status">Trạng thái</label><select class="admin-select" id="product-status" name="product_status"><option value="draft"' + (state.productForm.product_status === "draft" ? " selected" : "") + '>Bản nháp</option><option value="active"' + (state.productForm.product_status === "active" ? " selected" : "") + '>Đang bán</option><option value="archived"' + (state.productForm.product_status === "archived" ? " selected" : "") + '>Lưu trữ</option></select></div>' +
      '<div class="admin-field admin-field-full"><label for="product-description">Mô tả</label><textarea class="admin-textarea" id="product-description" name="description">' + escapeHtml(state.productForm.description) + '</textarea></div>' +
      '<div class="admin-field admin-field-full"><label>Ảnh sản phẩm</label><div class="admin-image-preview admin-image-preview--grid">' + buildImagePreview() + '</div></div>' +
      '</div>' +
      '<div class="admin-checkbox-row"><label><input type="checkbox" name="track_inventory"' + (state.productForm.track_inventory ? " checked" : "") + ' /> Theo dõi tồn kho</label><label><input type="checkbox" name="is_featured"' + (state.productForm.is_featured ? " checked" : "") + ' /> Đánh dấu nổi bật</label></div>' +
      buildFeedback(state.productFeedback) +
      '<div class="admin-form-actions"><button class="admin-button" type="submit"' + (state.submitting ? " disabled" : "") + '>' + (state.submitting ? "Đang xử lý..." : submitLabel) + '</button><button class="admin-secondary-button" type="button" data-close-modal>Hủy</button></div>' +
      '</form></div></div>';
  }

  function buildProductsView() {
    return '<section class="admin-panel">' + buildProductsToolbar() + buildProductsTable() + '</section>' + buildModal();
  }

  function buildUnauthorizedView() {
    return '<div class="admin-empty-card"><h2>Chỉ tài khoản admin mới truy cập được khu vực này.</h2><p>Hãy đăng nhập bằng tài khoản có quyền quản trị.</p></div>';
  }

  function syncFormToState() {
    var form = document.querySelector("[data-product-form]");
    if (!form) return;
    var formData = new FormData(form);
    ["name", "description", "price", "compare_at_price", "stock_quantity", "product_status"].forEach(function (key) {
      var value = formData.get(key);
      if (value !== null) state.productForm[key] = value;
    });
    state.productForm.track_inventory = formData.get("track_inventory") === "on";
    state.productForm.is_featured = formData.get("is_featured") === "on";
  }

  function enhanceProductsAdminUi() {
    var stats = root.querySelector(".admin-toolbar-stats");
    var hotCount = state.products.filter(function (p) { return !!p.is_featured; }).length;
    if (stats && hotCount > 0 && !stats.querySelector("[data-hot-stat]")) {
      var hotStat = document.createElement("span");
      hotStat.className = "admin-stat is-warning";
      hotStat.setAttribute("data-hot-stat", "true");
      hotStat.textContent = hotCount + " \u0111ang hot";
      stats.appendChild(hotStat);
    }

    var filtersPanel = root.querySelector("[data-filters-panel]");
    if (filtersPanel && !filtersPanel.querySelector("[data-featured-filter-section]")) {
      var featuredSection = document.createElement("div");
      featuredSection.className = "admin-filter-section";
      featuredSection.setAttribute("data-featured-filter-section", "true");
      featuredSection.innerHTML =
        '<span class="admin-filter-label">\u0110\u1ed9 hot</span>' +
        '<div class="admin-filter-chips">' +
          '<button class="admin-filter-chip' + (state.filterFeatured === "all" ? ' is-active' : '') + '" type="button" data-filter-featured-chip="all">T\u1ea5t c\u1ea3</button>' +
          '<button class="admin-filter-chip' + (state.filterFeatured === "hot" ? ' is-active' : '') + '" type="button" data-filter-featured-chip="hot">HOT</button>' +
          '<button class="admin-filter-chip' + (state.filterFeatured === "normal" ? ' is-active' : '') + '" type="button" data-filter-featured-chip="normal">B\u00ecnh th\u01b0\u1eddng</button>' +
        '</div>';
      filtersPanel.appendChild(featuredSection);
    }

    root.querySelectorAll("[data-product-row]").forEach(function (row) {
      var productId = row.getAttribute("data-product-row");
      var product = state.products.find(function (item) { return item.id === productId; });
      if (!product || !product.is_featured) return;

      var title = row.querySelector(".admin-product-cell strong");
      if (!title || title.parentElement.querySelector("[data-hot-badge]")) return;

      var badge = document.createElement("span");
      badge.className = "admin-status-chip is-warning";
      badge.setAttribute("data-hot-badge", "true");
      badge.textContent = "HOT";
      title.insertAdjacentText("afterend", " ");
      title.parentElement.insertBefore(badge, title.nextSibling.nextSibling);
    });
  }

  function render() {
    var activeEl = document.activeElement;
    var focusSelector = activeEl && activeEl.getAttribute("data-search-input") !== null ? "[data-search-input]" : null;
    var cursorPos = focusSelector && typeof activeEl.selectionStart === "number" ? activeEl.selectionStart : null;

    document.body.classList.toggle("admin-modal-open", state.modalOpen);
    document.querySelectorAll("[data-admin-link]").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-admin-link") === "products");
    });
    if (!state.user || String(state.user.role || "").toLowerCase() !== "admin") {
      document.body.classList.remove("admin-modal-open");
      root.innerHTML = buildUnauthorizedView();
      return;
    }
    syncFormToState();
    root.innerHTML = buildProductsView();
    enhanceProductsAdminUi();

    if (focusSelector) {
      var el = root.querySelector(focusSelector);
      if (el) {
        el.focus();
        if (cursorPos !== null) {
          el.selectionStart = el.selectionEnd = cursorPos;
        }
      }
    }
  }

  function setProductFeedback(message, type) {
    state.productFeedback = message ? { message: message, type: type } : null;
  }

  function openModal() {
    state.modalOpen = true;
    state.editingProductId = null;
    state.productForm = createEmptyProductForm();
    state.images = [];
    state.categorySearch = "";
    state.categoryDropdownOpen = false;
    state.submitting = false;
    setProductFeedback("", null);
    render();
  }

  function openEditModal(productId) {
    var product = state.products.find(function (p) { return p.id === productId; });
    if (!product) return;

    state.modalOpen = true;
    state.editingProductId = productId;
    state.productForm = {
      name: product.name || "",
      category_id: product.category_id || "",
      category_name: product.category_name || "",
      description: product.description || "",
      price: String(product.price || ""),
      compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : "",
      stock_quantity: String(product.stock_quantity != null ? product.stock_quantity : 0),
      product_status: product.product_status || "draft",
      track_inventory: product.track_inventory !== false,
      is_featured: !!product.is_featured
    };
    state.categorySearch = product.category_name || "";
    var imgList = Array.isArray(product.images) ? product.images : [];
    if (!imgList.length && product.cover_image_url) imgList = [product.cover_image_url];
    state.images = imgList.map(function (url) { return { type: "existing", url: url }; });
    state.categoryDropdownOpen = false;
    state.submitting = false;
    setProductFeedback("", null);
    render();
  }

  function closeModal() {
    state.modalOpen = false;
    state.editingProductId = null;
    state.images = [];
    state.categorySearch = "";
    state.categoryDropdownOpen = false;
    state.submitting = false;
    setProductFeedback("", null);
    render();
  }

  function readProductForm(form) {
    var formData = new FormData(form);
    return {
      name: String(formData.get("name") || "").trim(),
      category_id: state.productForm.category_id || null,
      category_name: !state.productForm.category_id && state.categorySearch.trim() ? state.categorySearch.trim() : null,
      description: String(formData.get("description") || "").trim(),
      price: String(formData.get("price") || "").trim(),
      compare_at_price: String(formData.get("compare_at_price") || "").trim(),
      stock_quantity: String(formData.get("stock_quantity") || "0").trim(),
      product_status: String(formData.get("product_status") || "draft"),
      track_inventory: formData.get("track_inventory") === "on",
      is_featured: formData.get("is_featured") === "on"
    };
  }

  function buildProductFormData(form) {
    var payload = readProductForm(form);
    var body = new FormData();
    Object.keys(payload).forEach(function (key) {
      var value = payload[key];
      if (value === null || value === undefined || value === "") return;
      body.append(key, String(value));
    });
    state.images.forEach(function (img) {
      if (img.type === "pending") body.append("image_file", img.file);
    });
    return body;
  }

  function buildProductJsonBody(form) {
    var payload = readProductForm(form);
    var body = {};
    Object.keys(payload).forEach(function (key) {
      var value = payload[key];
      if (value === null || value === undefined || value === "") return;
      body[key] = value;
    });
    return body;
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-open-modal]")) {
      openModal();
      return;
    }

    if (event.target.closest("[data-close-modal]") || event.target.matches("[data-modal-overlay]")) {
      closeModal();
      return;
    }

    if (event.target.closest("[data-toggle-filters]")) {
      state.filtersOpen = !state.filtersOpen;
      render();
      return;
    }

    var pageBtn = event.target.closest("[data-page]");
    if (pageBtn) {
      var pg = Number(pageBtn.getAttribute("data-page"));
      if (pg >= 1) { state.currentPage = pg; render(); }
      return;
    }

    if (event.target.closest("[data-clear-filters]")) {
      state.filterStatus = "all";
      state.filterCategory = "all";
      state.filterStock = "all";
      state.filterFeatured = "all";
      state.currentPage = 1;
      render();
      return;
    }

    var statusChip = event.target.closest("[data-filter-status-chip]");
    if (statusChip) { state.filterStatus = statusChip.getAttribute("data-filter-status-chip"); state.currentPage = 1; render(); return; }

    var categoryChip = event.target.closest("[data-filter-category-chip]");
    if (categoryChip) { state.filterCategory = categoryChip.getAttribute("data-filter-category-chip"); state.currentPage = 1; render(); return; }

    var stockChip = event.target.closest("[data-filter-stock-chip]");
    if (stockChip) { state.filterStock = stockChip.getAttribute("data-filter-stock-chip"); state.currentPage = 1; render(); return; }

    var featuredChip = event.target.closest("[data-filter-featured-chip]");
    if (featuredChip) { state.filterFeatured = featuredChip.getAttribute("data-filter-featured-chip"); state.currentPage = 1; render(); return; }

    if (event.target.closest("[data-add-images]")) {
      persistentFileInput.click();
      return;
    }

    var setCoverBtn = event.target.closest("[data-set-cover]");
    if (setCoverBtn) {
      var ci = parseInt(setCoverBtn.getAttribute("data-set-cover"), 10);
      if (ci > 0 && ci < state.images.length) {
        var moved = state.images.splice(ci, 1)[0];
        state.images.unshift(moved);
        render();
      }
      return;
    }

    var removeBtn = event.target.closest("[data-remove-image]");
    if (removeBtn) {
      var ri = parseInt(removeBtn.getAttribute("data-remove-image"), 10);
      state.images.splice(ri, 1);
      render();
      return;
    }

    var editButton = event.target.closest("[data-product-edit]");
    if (editButton) {
      event.stopPropagation();
      openEditModal(editButton.getAttribute("data-product-edit"));
      return;
    }

    var categorySelectButton = event.target.closest("[data-category-select]");
    if (categorySelectButton) {
      var categoryId = categorySelectButton.getAttribute("data-category-select");
      var category = state.categories.find(function (c) { return c.id === categoryId; });
      if (category) {
        state.productForm.category_id = category.id;
        state.categorySearch = category.name;
      }
      state.categoryDropdownOpen = false;
      render();
      return;
    }

    if (event.target.closest("[data-category-select-none]")) {
      state.productForm.category_id = "";
      state.categorySearch = "";
      state.categoryDropdownOpen = false;
      render();
      return;
    }

    if (event.target.closest("[data-category-create]")) {
      state.productForm.category_id = "";
      state.categoryDropdownOpen = false;
      render();
      return;
    }

    var deleteButton = event.target.closest("[data-product-delete]");
    if (deleteButton) {
      event.stopPropagation();
      var productId = deleteButton.getAttribute("data-product-delete");
      if (!window.confirm("Xóa sản phẩm này? Hành động không thể hoàn tác.")) return;
      fetch("/api/admin/products/" + productId, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      })
        .then(parseJsonWithResponse)
        .then(function () { return reloadAdminData(); })
        .then(function () { render(); })
        .catch(function (error) { window.alert(error.message || "Không thể xóa sản phẩm."); });
      return;
    }

    if (!event.target.closest(".admin-combobox") && state.categoryDropdownOpen) {
      state.categoryDropdownOpen = false;
      render();
    }
  });

  document.addEventListener("submit", function (event) {
    var productForm = event.target.closest("[data-product-form]");
    if (!productForm) return;
    event.preventDefault();

    if (state.submitting) return;
    state.submitting = true;
    render();

    if (state.editingProductId) {
      var editBody = buildProductFormData(productForm);
      var keptUrls = state.images.filter(function (img) { return img.type === "existing"; }).map(function (img) { return img.url; });
      editBody.append("existing_images", JSON.stringify(keptUrls));
      // Send image order: existing urls first by their position, then pending files appended after
      // Backend needs to know the intended order: existing_images_order tells it where to interleave
      var imageOrder = state.images.map(function (img) { return img.type === "existing" ? "e" : "p"; });
      editBody.append("image_order", JSON.stringify(imageOrder));
      fetch("/api/admin/products/" + state.editingProductId, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        body: editBody
      })
        .then(parseJsonWithResponse)
        .then(function () {
          state.modalOpen = false;
          state.editingProductId = null;
          state.productForm = createEmptyProductForm();
          state.pendingImages = [];
          state.existingImages = [];
          state.categorySearch = "";
          return reloadAdminData();
        })
        .then(function () { state.submitting = false; render(); })
        .catch(function (error) {
          state.submitting = false;
          setProductFeedback(error.message || "Không thể cập nhật sản phẩm.", "error");
          render();
        });
    } else {
      fetch("/api/admin/products", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        body: buildProductFormData(productForm)
      })
        .then(parseJsonWithResponse)
        .then(function () {
          state.modalOpen = false;
          state.productForm = createEmptyProductForm();
          state.pendingImages = [];
          state.existingImages = [];
          state.categorySearch = "";
          return reloadAdminData();
        })
        .then(function () { state.submitting = false; render(); })
        .catch(function (error) {
          state.submitting = false;
          setProductFeedback(error.message || "Không thể tạo sản phẩm.", "error");
          render();
        });
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.closest("[data-search-input]")) {
      state.searchQuery = event.target.value;
      state.currentPage = 1;
      render();
      return;
    }

    var categoryInput = event.target.closest("#product-category");
    if (!categoryInput) return;

    state.categorySearch = categoryInput.value;
    state.productForm.category_id = "";
    state.categoryDropdownOpen = true;

    var query = state.categorySearch.toLowerCase();
    var dropdown = categoryInput.parentElement.querySelector(".admin-combobox-dropdown");
    if (dropdown) dropdown.remove();

    var filtered = query
      ? state.categories.filter(function (c) { return c.name.toLowerCase().includes(query); })
      : state.categories;
    var exactMatch = state.categories.some(function (c) { return c.name.toLowerCase() === query; });
    var showCreate = query && !exactMatch;

    if (!filtered.length && !showCreate) return;

    var menu = document.createElement("div");
    menu.className = "admin-combobox-dropdown";

    var noneButton = document.createElement("button");
    noneButton.className = "admin-combobox-option";
    noneButton.type = "button";
    noneButton.setAttribute("data-category-select-none", "");
    noneButton.textContent = "Chưa phân loại";
    menu.appendChild(noneButton);

    filtered.forEach(function (c) {
      var button = document.createElement("button");
      button.className = "admin-combobox-option";
      button.type = "button";
      button.setAttribute("data-category-select", c.id);
      button.textContent = c.name;
      menu.appendChild(button);
    });

    if (showCreate) {
      var createButton = document.createElement("button");
      createButton.className = "admin-combobox-option is-create";
      createButton.type = "button";
      createButton.setAttribute("data-category-create", state.categorySearch);
      createButton.textContent = 'Tạo danh mục "' + state.categorySearch + '"';
      menu.appendChild(createButton);
    }

    categoryInput.parentElement.appendChild(menu);
  });


  document.addEventListener("focus", function (event) {
    if (event.target.closest("#product-category")) state.categoryDropdownOpen = true;
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && state.modalOpen) closeModal();
  });

  fetchCurrentUser()
    .then(function (user) {
      state.user = user;
      if (!user || String(user.role || "").toLowerCase() !== "admin") { render(); return null; }
      return reloadAdminData().then(function () { render(); });
    })
    .catch(function (error) {
      root.innerHTML = '<div class="admin-empty-card"><h2>Không thể tải giao diện quản trị.</h2><p>' + escapeHtml(error?.message || "Đã xảy ra lỗi.") + "</p></div>";
    });
})();
