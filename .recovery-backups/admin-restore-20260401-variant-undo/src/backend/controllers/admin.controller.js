const { getPool } = require("../db/pool");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}

function hasOwnProperty(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

function parseJsonBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createHttpError(400, "Body request không hợp lệ.");
  }

  return body;
}

function normalizeRequiredText(value, label, maxLength) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    throw createHttpError(400, `${label} là bắt buộc.`);
  }

  if (normalized.length > maxLength) {
    throw createHttpError(400, `${label} vượt quá ${maxLength} ký tự.`);
  }

  return normalized;
}

function normalizeOptionalText(value, label, maxLength) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw createHttpError(400, `${label} vượt quá ${maxLength} ký tự.`);
  }

  return normalized;
}

function normalizeOptionalCurrency(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createHttpError(400, `${label} không hợp lệ.`);
  }

  return parsed;
}

function normalizeRequiredCurrency(value, label) {
  const parsed = normalizeOptionalCurrency(value, label);

  if (parsed === null) {
    throw createHttpError(400, `${label} là bắt buộc.`);
  }

  return parsed;
}

function normalizeInteger(value, label, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw createHttpError(400, `${label} không hợp lệ.`);
  }

  return parsed;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

function normalizeStatus(value, allowed, label, fallback) {
  const normalized = String(value || fallback || "").trim().toLowerCase();

  if (!allowed.includes(normalized)) {
    throw createHttpError(400, `${label} không hợp lệ.`);
  }

  return normalized;
}

function validateUuid(value, label) {
  const normalized = String(value || "").trim();

  if (!UUID_PATTERN.test(normalized)) {
    throw createHttpError(400, `${label} không hợp lệ.`);
  }

  return normalized;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 160);
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.category_status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    seller_id: row.seller_id,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    short_description: row.short_description,
    description: row.description,
    price: Number(row.price || 0),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    currency_code: row.currency_code,
    stock_quantity: Number(row.stock_quantity || 0),
    track_inventory: row.track_inventory,
    product_status: row.product_status,
    cover_image_url: row.cover_image_url,
    is_featured: row.is_featured,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function ensureCategoryExists(client, categoryId) {
  if (!categoryId) {
    return null;
  }

  const result = await client.query(
    `
      select id, name, slug
      from product_categories
      where id = $1
      limit 1
    `,
    [categoryId]
  );

  if (!result.rowCount) {
    throw createHttpError(404, "Không tìm thấy danh mục.");
  }

  return result.rows[0];
}

async function listCategories(_req, res, next) {
  try {
    const result = await getPool().query(
      `
        select id, name, slug, description, category_status, created_at, updated_at
        from product_categories
        order by lower(name) asc, created_at desc
      `
    );

    res.json({
      items: result.rows.map(mapCategory),
      total: result.rowCount
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  const client = await getPool().connect();

  try {
    const body = parseJsonBody(req.body);
    const name = normalizeRequiredText(body.name, "Tên danh mục", 120);
    const slug = normalizeRequiredText(body.slug || slugify(name), "Slug danh mục", 160);
    const description = normalizeOptionalText(body.description, "Mô tả danh mục", 1000);
    const status = normalizeStatus(body.status, ["active", "inactive"], "Trạng thái danh mục", "active");

    const result = await client.query(
      `
        insert into product_categories (
          name,
          slug,
          description,
          category_status
        )
        values ($1, $2, $3, $4)
        returning id, name, slug, description, category_status, created_at, updated_at
      `,
      [name, slug, description, status]
    );

    res.status(201).json({
      message: "Đã tạo danh mục thành công.",
      category: mapCategory(result.rows[0])
    });
  } catch (error) {
    if (error?.code === "23505") {
      res.status(409).json({
        message: "Slug danh mục đã tồn tại."
      });
      return;
    }

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function updateCategory(req, res, next) {
  const client = await getPool().connect();

  try {
    const body = parseJsonBody(req.body);
    const categoryId = validateUuid(req.params.categoryId, "Mã danh mục");
    const existing = await client.query(
      `
        select id, name, slug, description, category_status, created_at, updated_at
        from product_categories
        where id = $1
        limit 1
      `,
      [categoryId]
    );

    if (!existing.rowCount) {
      throw createHttpError(404, "Không tìm thấy danh mục.");
    }

    const current = existing.rows[0];
    const name = hasOwnProperty(body, "name")
      ? normalizeRequiredText(body.name, "Tên danh mục", 120)
      : current.name;
    const slug = hasOwnProperty(body, "slug")
      ? normalizeRequiredText(body.slug || slugify(name), "Slug danh mục", 160)
      : current.slug;
    const description = hasOwnProperty(body, "description")
      ? normalizeOptionalText(body.description, "Mô tả danh mục", 1000)
      : current.description;
    const status = hasOwnProperty(body, "status")
      ? normalizeStatus(body.status, ["active", "inactive"], "Trạng thái danh mục", current.category_status)
      : current.category_status;

    const result = await client.query(
      `
        update product_categories
        set name = $2,
            slug = $3,
            description = $4,
            category_status = $5,
            updated_at = now()
        where id = $1
        returning id, name, slug, description, category_status, created_at, updated_at
      `,
      [categoryId, name, slug, description, status]
    );

    res.json({
      message: "Đã cập nhật danh mục.",
      category: mapCategory(result.rows[0])
    });
  } catch (error) {
    if (error?.code === "23505") {
      res.status(409).json({
        message: "Slug danh mục đã tồn tại."
      });
      return;
    }

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function deleteCategory(req, res, next) {
  const client = await getPool().connect();

  try {
    const categoryId = validateUuid(req.params.categoryId, "Mã danh mục");
    const result = await client.query(
      `
        delete from product_categories
        where id = $1
        returning id
      `,
      [categoryId]
    );

    if (!result.rowCount) {
      throw createHttpError(404, "Không tìm thấy danh mục.");
    }

    res.json({
      message: "Đã xóa danh mục."
    });
  } catch (error) {
    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function listAdminProducts(req, res, next) {
  try {
    const values = [];
    const clauses = [];

    if (typeof req.query.status === "string" && req.query.status !== "all") {
      values.push(String(req.query.status).trim().toLowerCase());
      clauses.push(`p.product_status = $${values.length}`);
    }

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      values.push(`%${req.query.search.trim().toLowerCase()}%`);
      clauses.push(`(lower(p.name) like $${values.length} or lower(coalesce(p.short_description, '')) like $${values.length})`);
    }

    const whereClause = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const result = await getPool().query(
      `
        select
          p.id,
          p.seller_id,
          p.category_id,
          c.name as category_name,
          c.slug as category_slug,
          p.name,
          p.slug,
          p.sku,
          p.short_description,
          p.description,
          p.price,
          p.compare_at_price,
          p.currency_code,
          p.stock_quantity,
          p.track_inventory,
          p.product_status,
          p.cover_image_url,
          p.is_featured,
          p.published_at,
          p.created_at,
          p.updated_at
        from products p
        left join product_categories c on c.id = p.category_id
        ${whereClause}
        order by p.created_at desc
      `,
      values
    );

    res.json({
      items: result.rows.map(mapProduct),
      total: result.rowCount
    });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  const client = await getPool().connect();

  try {
    const body = parseJsonBody(req.body);
    const name = normalizeRequiredText(body.name, "Tên sản phẩm", 255);
    const slug = normalizeRequiredText(body.slug || slugify(name), "Slug sản phẩm", 255);
    const sku = normalizeOptionalText(body.sku, "SKU", 100);
    const shortDescription = normalizeOptionalText(body.short_description, "Mô tả ngắn", 4000);
    const description = normalizeOptionalText(body.description, "Mô tả chi tiết", 20000);
    const price = normalizeRequiredCurrency(body.price, "Giá bán");
    const compareAtPrice = normalizeOptionalCurrency(body.compare_at_price, "Giá niêm yết");
    const stockQuantity = normalizeInteger(body.stock_quantity, "Số lượng tồn", 0);
    const productStatus = normalizeStatus(
      body.product_status,
      ["draft", "active", "archived"],
      "Trạng thái sản phẩm",
      "draft"
    );
    const categoryId = body.category_id
      ? validateUuid(body.category_id, "Mã danh mục")
      : null;
    const coverImageUrl = normalizeOptionalText(body.cover_image_url, "Ảnh bìa", 2000);
    const trackInventory = normalizeBoolean(body.track_inventory, true);
    const isFeatured = normalizeBoolean(body.is_featured, false);

    if (compareAtPrice !== null && compareAtPrice < price) {
      throw createHttpError(400, "Giá niêm yết phải lớn hơn hoặc bằng giá bán.");
    }

    const category = await ensureCategoryExists(client, categoryId);
    const result = await client.query(
      `
        insert into products (
          seller_id,
          category_id,
          name,
          slug,
          sku,
          short_description,
          description,
          price,
          compare_at_price,
          currency_code,
          stock_quantity,
          track_inventory,
          product_status,
          cover_image_url,
          is_featured,
          published_at
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 'VND', $10, $11, $12, $13, $14,
          case when $12 = 'active' then now() else null end
        )
        returning
          id,
          seller_id,
          category_id,
          name,
          slug,
          sku,
          short_description,
          description,
          price,
          compare_at_price,
          currency_code,
          stock_quantity,
          track_inventory,
          product_status,
          cover_image_url,
          is_featured,
          published_at,
          created_at,
          updated_at
      `,
      [
        req.currentUser.id,
        categoryId,
        name,
        slug,
        sku,
        shortDescription,
        description,
        price,
        compareAtPrice,
        stockQuantity,
        trackInventory,
        productStatus,
        coverImageUrl,
        isFeatured
      ]
    );

    const product = mapProduct({
      ...result.rows[0],
      category_name: category?.name || null,
      category_slug: category?.slug || null
    });

    res.status(201).json({
      message: "Đã tạo sản phẩm thành công.",
      product
    });
  } catch (error) {
    if (error?.code === "23505") {
      res.status(409).json({
        message: error.constraint === "products_sku_unique_idx" ? "SKU đã tồn tại." : "Slug sản phẩm đã tồn tại."
      });
      return;
    }

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAdminProducts,
  createProduct
};
