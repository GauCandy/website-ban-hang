(function () {
  const root = document.querySelector("[data-admin-root]");

  if (!root) {
    return;
  }

  const state = {
    currentRoute: getRouteFromPath(window.location.pathname),
    user: null,
    products: [],
    categories: [],
    categoryForm: createEmptyCategoryForm(),
    productForm: createEmptyProductForm(),
    categoryFeedback: null,
    productFeedback: null,
    previewImageUrl: ""
  };

  function getRouteFromPath(pathname) {
    if (pathname === "/admin/products") {
      return "products";
    }

    return "categories";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      switch (character) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return character;
      }
    });
  }

  function parseJson(response) {
    return response.json().catch(function () {
      return null;
    });
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 120);
  }

  function createEmptyCategoryForm() {
    return {
      id: "",
      name: "",
      slug: "",
      description: "",
      status: "active"
    };
  }

  function createEmptyProductForm() {
    return {
      name: "",
      slug: "",
      sku: "",
      category_id: "",
      short_description: "",
      description: "",
      price: "",
      compare_at_price: "",
      stock_quantity: "0",
      product_status: "draft",
      cover_image_url: "",
      track_inventory: true,
      is_featured: false
    };
  }

  async function fetchCurrentUser() {
    const response = await fetch("/api/users/me", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (response.status === 401) {
      return null;
    }

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Không tải được thông tin tài khoản.");
    }

    return payload?.user || null;
  }

  async function fetchCategories() {
    const response = await fetch("/api/admin/categories", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Không tải được danh mục.");
    }

    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async function fetchAdminProducts() {
    const response = await fetch("/api/admin/products", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Không tải được danh sách sản phẩm.");
    }

    return Array.isArray(payload?.items) ? payload.items : [];
  }

  function setActiveNav() {
    document.querySelectorAll("[data-admin-link]").forEach(function (link) {
      const route = link.getAttribute("data-admin-link");
      link.classList.toggle("is-active", route === state.currentRoute);
    });
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
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

  function buildFeedback(markup) {
    if (!markup?.message) {
      return '<p class="admin-feedback"></p>';
    }

    return `<p class="admin-feedback ${markup.type === "error" ? "is-error" : "is-success"}">${escapeHtml(
      markup.message
    )}</p>`;
  }

  function buildAdminHero() {
    const sellingCount = state.products.filter(function (product) {
      return product.product_status === "active";
    }).length;

    return `
      <section class="admin-hero">
        <div class="admin-hero-copy">
          <p class="admin-kicker">Admin</p>
          <h2>${state.currentRoute === "products" ? "Quản lý sản phẩm" : "Quản lý danh mục sản phẩm"}</h2>
          <p>
            ${
              state.currentRoute === "products"
                ? "Thêm sản phẩm mới, định giá, mô tả, chọn danh mục và chuẩn bị ảnh bìa trước khi mở rộng thêm upload file thật."
                : "Quản lý nhóm sản phẩm để dùng lại trong form thêm sản phẩm và bộ lọc bán hàng."
            }
          </p>
        </div>
        <div class="admin-metrics">
          <article class="admin-metric">
            <span class="admin-metric-label">Danh mục</span>
            <strong class="admin-metric-value">${state.categories.length}</strong>
          </article>
          <article class="admin-metric">
            <span class="admin-metric-label">Sản phẩm</span>
            <strong class="admin-metric-value">${state.products.length}</strong>
          </article>
          <article class="admin-metric">
            <span class="admin-metric-label">Đang bán</span>
            <strong class="admin-metric-value">${sellingCount}</strong>
          </article>
          <article class="admin-metric">
            <span class="admin-metric-label">Tài khoản</span>
            <strong class="admin-metric-value">${escapeHtml(state.user?.full_name || "Admin")}</strong>
          </article>
        </div>
      </section>
    `;
  }

  function buildCategoriesView() {
    return `
      ${buildAdminHero()}
      <section class="admin-grid">
        <div class="admin-panel">
          <div class="admin-section-head">
            <div>
              <p class="admin-kicker">Admin</p>
              <h3 class="admin-section-title">Danh sách danh mục</h3>
            </div>
            <button class="admin-secondary-button" type="button" data-category-reset>Tạo danh mục mới</button>
          </div>

          <div class="admin-category-list">
            ${
              state.categories.length
                ? state.categories
                    .map(function (category) {
                      return `
                        <article class="admin-category-item">
                          <div class="admin-category-head">
                            <div>
                              <h4 class="admin-category-name">${escapeHtml(category.name)}</h4>
                              <p class="admin-card-copy">/${escapeHtml(category.slug)}</p>
                            </div>
                            <span class="admin-status-chip ${
                              category.status === "active" ? "is-success" : "is-muted"
                            }">${category.status === "active" ? "Hiển thị" : "Ẩn"}</span>
                          </div>
                          <p class="admin-card-copy">${escapeHtml(category.description || "Chưa có mô tả.")}</p>
                          <div class="admin-category-actions">
                            <button class="admin-secondary-button" type="button" data-category-edit="${category.id}">Sửa</button>
                            <button class="admin-danger-button" type="button" data-category-delete="${category.id}">Xóa</button>
                          </div>
                        </article>
                      `;
                    })
                    .join("")
                : '<div class="admin-empty-card"><p>Chưa có danh mục nào.</p></div>'
            }
          </div>
        </div>

        <aside class="admin-form-card">
          <p class="admin-kicker">Admin</p>
          <h3 class="admin-form-title">${state.categoryForm.id ? "Cập nhật danh mục" : "Thêm danh mục mới"}</h3>
          <p>Tạo cấu trúc danh mục để quản lý sản phẩm rõ ràng hơn.</p>
          <form class="admin-form" data-category-form>
            <div class="admin-field">
              <label for="category-name">Tên danh mục</label>
              <input class="admin-input" id="category-name" name="name" value="${escapeHtml(
                state.categoryForm.name
              )}" required />
            </div>
            <div class="admin-field">
              <label for="category-slug">Slug</label>
              <input class="admin-input" id="category-slug" name="slug" value="${escapeHtml(
                state.categoryForm.slug
              )}" placeholder="tu-dong-tao-tu-ten" />
            </div>
            <div class="admin-field">
              <label for="category-status">Trạng thái</label>
              <select class="admin-select" id="category-status" name="status">
                <option value="active" ${
                  state.categoryForm.status === "active" ? "selected" : ""
                }>Hiển thị</option>
                <option value="inactive" ${
                  state.categoryForm.status === "inactive" ? "selected" : ""
                }>Ẩn tạm</option>
              </select>
            </div>
            <div class="admin-field">
              <label for="category-description">Mô tả ngắn</label>
              <textarea class="admin-textarea" id="category-description" name="description">${escapeHtml(
                state.categoryForm.description
              )}</textarea>
            </div>
            ${buildFeedback(state.categoryFeedback)}
            <div class="admin-form-actions">
              <button class="admin-button" type="submit">${
                state.categoryForm.id ? "Lưu danh mục" : "Thêm danh mục"
              }</button>
              <button class="admin-secondary-button" type="button" data-category-reset>Làm mới form</button>
            </div>
          </form>
        </aside>
      </section>
    `;
  }

  function buildExistingProductsTable() {
    if (!state.products.length) {
      return '<div class="admin-empty-card"><p>Chưa có sản phẩm nào trong hệ thống.</p></div>';
    }

    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${state.products
              .map(function (product) {
                return `
                  <tr>
                    <td>
                      <strong>${escapeHtml(product.name)}</strong><br />
                      <span>${escapeHtml(product.slug)}</span>
                    </td>
                    <td>${escapeHtml(product.category_name || "Chưa gán")}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${escapeHtml(product.stock_quantity)}</td>
                    <td>${getStatusChip(product.product_status)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function buildLatestProductCard() {
    const latestProduct = state.products[0];

    if (!latestProduct) {
      return '<div class="admin-empty-card"><p>Chưa có sản phẩm nào vừa tạo.</p></div>';
    }

    return `
      <article class="admin-product-item">
        <div class="admin-product-head">
          <div>
            <h4 class="admin-product-name">${escapeHtml(latestProduct.name)}</h4>
            <p class="admin-card-copy">${escapeHtml(latestProduct.slug)}</p>
          </div>
          ${getStatusChip(latestProduct.product_status)}
        </div>
        <div class="admin-product-meta">
          <span class="admin-status-chip is-muted">${formatCurrency(latestProduct.price)}</span>
          <span class="admin-status-chip is-muted">Kho: ${escapeHtml(latestProduct.stock_quantity)}</span>
          ${
            latestProduct.category_name
              ? `<span class="admin-status-chip is-muted">${escapeHtml(latestProduct.category_name)}</span>`
              : ""
          }
        </div>
        <p class="admin-card-copy">${escapeHtml(latestProduct.short_description || "Chưa có mô tả ngắn.")}</p>
      </article>
    `;
  }

  function buildImagePreview() {
    if (state.previewImageUrl) {
      return `<img src="${escapeHtml(state.previewImageUrl)}" alt="Xem trước ảnh sản phẩm" />`;
    }

    return '<div class="admin-image-placeholder">Chọn file ảnh hoặc nhập URL ảnh để xem trước bìa sản phẩm.</div>';
  }

  function buildProductsView() {
    return `
      ${buildAdminHero()}
      <section class="admin-panel">
        <div class="admin-section-head">
          <div>
            <p class="admin-kicker">Admin</p>
            <h3 class="admin-section-title">Quản lý sản phẩm</h3>
          </div>
          <div class="admin-tabs">
            <button class="admin-tab-button is-active" type="button">Thêm sản phẩm</button>
            <button class="admin-tab-button" type="button" disabled>Upload ảnh file sẽ nối sau</button>
          </div>
        </div>

        <section class="admin-grid">
          <div class="admin-form-card">
            <p class="admin-kicker">Admin</p>
            <h3 class="admin-form-title">Thêm sản phẩm mới</h3>
            <p>Điền thông tin cơ bản, định giá và gắn danh mục. API sẽ lưu trực tiếp vào database.</p>
            <form class="admin-form" data-product-form>
              <div class="admin-field-grid">
                <div class="admin-field">
                  <label for="product-name">Tên sản phẩm</label>
                  <input class="admin-input" id="product-name" name="name" value="${escapeHtml(
                    state.productForm.name
                  )}" required />
                </div>
                <div class="admin-field">
                  <label for="product-slug">Slug</label>
                  <input class="admin-input" id="product-slug" name="slug" value="${escapeHtml(
                    state.productForm.slug
                  )}" placeholder="tu-dong-tao-tu-ten" />
                </div>
                <div class="admin-field">
                  <label for="product-sku">SKU</label>
                  <input class="admin-input" id="product-sku" name="sku" value="${escapeHtml(
                    state.productForm.sku
                  )}" />
                </div>
                <div class="admin-field">
                  <label for="product-category">Danh mục</label>
                  <select class="admin-select" id="product-category" name="category_id">
                    <option value="">Chọn danh mục</option>
                    ${state.categories
                      .map(function (category) {
                        return `<option value="${escapeHtml(category.id)}" ${
                          state.productForm.category_id === category.id ? "selected" : ""
                        }>${escapeHtml(category.name)}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
                <div class="admin-field">
                  <label for="product-price">Giá bán</label>
                  <input class="admin-input" id="product-price" name="price" type="number" min="0" step="1000" value="${escapeHtml(
                    state.productForm.price
                  )}" required />
                </div>
                <div class="admin-field">
                  <label for="product-compare-price">Giá niêm yết</label>
                  <input class="admin-input" id="product-compare-price" name="compare_at_price" type="number" min="0" step="1000" value="${escapeHtml(
                    state.productForm.compare_at_price
                  )}" />
                </div>
                <div class="admin-field">
                  <label for="product-stock">Số lượng tồn</label>
                  <input class="admin-input" id="product-stock" name="stock_quantity" type="number" min="0" step="1" value="${escapeHtml(
                    state.productForm.stock_quantity
                  )}" />
                </div>
                <div class="admin-field">
                  <label for="product-status">Trạng thái</label>
                  <select class="admin-select" id="product-status" name="product_status">
                    <option value="draft" ${
                      state.productForm.product_status === "draft" ? "selected" : ""
                    }>Bản nháp</option>
                    <option value="active" ${
                      state.productForm.product_status === "active" ? "selected" : ""
                    }>Đang bán</option>
                    <option value="archived" ${
                      state.productForm.product_status === "archived" ? "selected" : ""
                    }>Lưu trữ</option>
                  </select>
                </div>
                <div class="admin-field admin-field-full">
                  <label for="product-short-description">Mô tả ngắn</label>
                  <textarea class="admin-textarea" id="product-short-description" name="short_description">${escapeHtml(
                    state.productForm.short_description
                  )}</textarea>
                </div>
                <div class="admin-field admin-field-full">
                  <label for="product-description">Mô tả chi tiết</label>
                  <textarea class="admin-textarea" id="product-description" name="description">${escapeHtml(
                    state.productForm.description
                  )}</textarea>
                </div>
                <div class="admin-field admin-field-full">
                  <label for="product-cover-image-url">URL ảnh bìa</label>
                  <input class="admin-input" id="product-cover-image-url" name="cover_image_url" value="${escapeHtml(
                    state.productForm.cover_image_url
                  )}" placeholder="https://..." />
                </div>
                <div class="admin-field admin-field-full">
                  <label for="product-image-file">Upload ảnh bìa</label>
                  <div class="admin-image-drop">
                    <input class="admin-input" id="product-image-file" name="image_file" type="file" accept="image/*" />
                    <span class="admin-helper">File hiện chỉ dùng để preview. API hiện lưu trường cover_image_url; nếu cần upload thật mình sẽ thêm multipart/form-data ở bước sau.</span>
                  </div>
                </div>
              </div>
              <div class="admin-checkbox-row">
                <label><input type="checkbox" name="track_inventory" ${
                  state.productForm.track_inventory ? "checked" : ""
                } /> Theo dõi tồn kho</label>
                <label><input type="checkbox" name="is_featured" ${
                  state.productForm.is_featured ? "checked" : ""
                } /> Đánh dấu nổi bật</label>
              </div>
              ${buildFeedback(state.productFeedback)}
              <div class="admin-form-actions">
                <button class="admin-button" type="submit">Tạo sản phẩm</button>
                <button class="admin-secondary-button" type="button" data-product-reset>Làm mới form</button>
              </div>
            </form>
          </div>

          <aside class="admin-preview-card">
            <p class="admin-kicker">Preview</p>
            <h3 class="admin-preview-title">Ảnh bìa sản phẩm</h3>
            <p class="admin-preview-copy">Kiểm tra nhanh ảnh đại diện trước khi lưu.</p>
            <div class="admin-image-preview">${buildImagePreview()}</div>
          </aside>
        </section>

        <section class="admin-grid">
          <div class="admin-card">
            <div class="admin-card-head">
              <div>
                <p class="admin-kicker">Database</p>
                <h3 class="admin-card-title">Sản phẩm trong hệ thống</h3>
              </div>
            </div>
            ${buildExistingProductsTable()}
          </div>

          <div class="admin-card">
            <div class="admin-card-head">
              <div>
                <p class="admin-kicker">Mới tạo</p>
                <h3 class="admin-card-title">Sản phẩm gần nhất</h3>
              </div>
            </div>
            ${buildLatestProductCard()}
          </div>
        </section>
      </section>
    `;
  }

  function buildUnauthorizedView() {
    return `
      <div class="admin-empty-card">
        <p class="admin-kicker">Trang quản trị</p>
        <h2>Chỉ tài khoản admin mới truy cập được khu vực này.</h2>
        <p>Hãy đăng nhập bằng tài khoản có quyền quản trị để quản lý danh mục và sản phẩm.</p>
      </div>
    `;
  }

  function render() {
    setActiveNav();

    if (!state.user || String(state.user.role || "").toLowerCase() !== "admin") {
      root.innerHTML = buildUnauthorizedView();
      return;
    }

    root.innerHTML = state.currentRoute === "products" ? buildProductsView() : buildCategoriesView();
  }

  function navigate(route) {
    const nextPath = route === "products" ? "/admin/products" : "/admin/categories";

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    state.currentRoute = route;
    render();
  }

  function setCategoryFeedback(message, type) {
    state.categoryFeedback = message ? { message, type } : null;
  }

  function setProductFeedback(message, type) {
    state.productFeedback = message ? { message, type } : null;
  }

  function resetCategoryForm() {
    state.categoryForm = createEmptyCategoryForm();
    setCategoryFeedback("", null);
    render();
  }

  function resetProductForm() {
    state.productForm = createEmptyProductForm();
    state.previewImageUrl = "";
    setProductFeedback("", null);
    render();
  }

  function readCategoryForm(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();

    return {
      id: state.categoryForm.id,
      name,
      slug: slug || slugify(name),
      description: String(formData.get("description") || "").trim(),
      status: String(formData.get("status") || "active")
    };
  }

  function readProductForm(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();

    return {
      name,
      slug: slug || slugify(name),
      sku: String(formData.get("sku") || "").trim(),
      category_id: String(formData.get("category_id") || "").trim() || null,
      short_description: String(formData.get("short_description") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      price: String(formData.get("price") || "").trim(),
      compare_at_price: String(formData.get("compare_at_price") || "").trim(),
      stock_quantity: String(formData.get("stock_quantity") || "0").trim(),
      product_status: String(formData.get("product_status") || "draft"),
      cover_image_url: String(formData.get("cover_image_url") || "").trim(),
      track_inventory: formData.get("track_inventory") === "on",
      is_featured: formData.get("is_featured") === "on"
    };
  }

  async function reloadAdminData() {
    const results = await Promise.all([fetchCategories(), fetchAdminProducts()]);
    state.categories = results[0];
    state.products = results[1];
  }

  document.addEventListener("click", function (event) {
    const navLink = event.target.closest("[data-admin-link]");

    if (navLink) {
      event.preventDefault();
      navigate(navLink.getAttribute("data-admin-link"));
      return;
    }

    const editCategoryButton = event.target.closest("[data-category-edit]");

    if (editCategoryButton) {
      const categoryId = editCategoryButton.getAttribute("data-category-edit");
      const category = state.categories.find(function (item) {
        return item.id === categoryId;
      });

      if (category) {
        state.categoryForm = Object.assign({}, category);
        setCategoryFeedback("Đang chỉnh sửa danh mục đã chọn.", "success");
        render();
      }
      return;
    }

    const deleteCategoryButton = event.target.closest("[data-category-delete]");

    if (deleteCategoryButton) {
      const categoryId = deleteCategoryButton.getAttribute("data-category-delete");
      fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      })
        .then(parseJsonWithResponse)
        .then(function () {
          return reloadAdminData();
        })
        .then(function () {
          if (state.categoryForm.id === categoryId) {
            state.categoryForm = createEmptyCategoryForm();
          }
          setCategoryFeedback("Đã xóa danh mục.", "success");
          render();
        })
        .catch(function (error) {
          setCategoryFeedback(error.message || "Không thể xóa danh mục.", "error");
          render();
        });
      return;
    }

    if (event.target.closest("[data-category-reset]")) {
      resetCategoryForm();
      return;
    }

    if (event.target.closest("[data-product-reset]")) {
      resetProductForm();
    }
  });

  document.addEventListener("submit", function (event) {
    const categoryForm = event.target.closest("[data-category-form]");

    if (categoryForm) {
      event.preventDefault();
      const payload = readCategoryForm(categoryForm);
      const endpoint = payload.id ? `/api/admin/categories/${payload.id}` : "/api/admin/categories";
      const method = payload.id ? "PATCH" : "POST";

      fetch(endpoint, {
        method,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(parseJsonWithResponse)
        .then(function () {
          state.categoryForm = createEmptyCategoryForm();
          return reloadAdminData();
        })
        .then(function () {
          setCategoryFeedback(payload.id ? "Đã cập nhật danh mục." : "Đã thêm danh mục mới.", "success");
          render();
        })
        .catch(function (error) {
          setCategoryFeedback(error.message || "Không thể lưu danh mục.", "error");
          render();
        });
      return;
    }

    const productForm = event.target.closest("[data-product-form]");

    if (productForm) {
      event.preventDefault();
      const payload = readProductForm(productForm);

      fetch("/api/admin/products", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(parseJsonWithResponse)
        .then(function () {
          state.productForm = createEmptyProductForm();
          state.previewImageUrl = "";
          return reloadAdminData();
        })
        .then(function () {
          setProductFeedback("Đã tạo sản phẩm thành công.", "success");
          render();
        })
        .catch(function (error) {
          setProductFeedback(error.message || "Không thể tạo sản phẩm.", "error");
          render();
        });
    }
  });

  function parseJsonWithResponse(response) {
    return parseJson(response).then(function (payload) {
      if (!response.ok) {
        throw new Error(payload?.message || "Yêu cầu không thành công.");
      }

      return payload;
    });
  }

  document.addEventListener("input", function (event) {
    const categoryName = event.target.closest("#category-name");

    if (categoryName && !state.categoryForm.id) {
      const slugInput = document.querySelector("#category-slug");

      if (slugInput && !slugInput.value.trim()) {
        slugInput.value = slugify(categoryName.value);
      }
    }

    const productName = event.target.closest("#product-name");

    if (productName) {
      const slugInput = document.querySelector("#product-slug");

      if (slugInput && !slugInput.value.trim()) {
        slugInput.value = slugify(productName.value);
      }
    }

  });

  document.addEventListener("change", function (event) {
    const coverImageInput = event.target.closest("#product-cover-image-url");

    if (coverImageInput) {
      state.previewImageUrl = coverImageInput.value.trim();
      render();
      return;
    }

    const imageInput = event.target.closest("#product-image-file");

    if (!imageInput) {
      return;
    }

    const file = imageInput.files && imageInput.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      state.previewImageUrl = typeof reader.result === "string" ? reader.result : "";
      render();
    };
    reader.readAsDataURL(file);
  });

  window.addEventListener("popstate", function () {
    state.currentRoute = getRouteFromPath(window.location.pathname);
    render();
  });

  fetchCurrentUser()
    .then(function (user) {
      state.user = user;

      if (!user || String(user.role || "").toLowerCase() !== "admin") {
        render();
        return null;
      }

      return reloadAdminData().then(function () {
        render();
      });
    })
    .catch(function (error) {
      root.innerHTML = `
        <div class="admin-empty-card">
          <p class="admin-kicker">Trang quản trị</p>
          <h2>Không thể tải giao diện quản trị.</h2>
          <p>${escapeHtml(error?.message || "Đã xảy ra lỗi khi khởi tạo trang quản trị.")}</p>
        </div>
      `;
    });
})();
