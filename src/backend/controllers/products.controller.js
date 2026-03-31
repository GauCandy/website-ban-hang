const { getPool } = require("../db/pool");

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

function clampLimit(rawValue, fallback = DEFAULT_LIMIT) {
  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function mapProduct(row) {
  const price = Number(row.price || 0);
  const compareAtPrice = row.compare_at_price == null ? null : Number(row.compare_at_price);
  const publishedAt = row.published_at || row.created_at;
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  return {
    id: row.id,
    seller_id: row.seller_id,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    seller_name: row.seller_name,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    short_description: row.short_description,
    description: row.description,
    price,
    compare_at_price: compareAtPrice,
    currency_code: row.currency_code,
    stock_quantity: Number(row.stock_quantity || 0),
    track_inventory: row.track_inventory,
    product_status: row.product_status,
    cover_image_url: row.cover_image_url,
    is_featured: row.is_featured,
    published_at: publishedAt,
    created_at: row.created_at,
    updated_at: row.updated_at,
    discount_percent: discountPercent,
    is_on_sale: discountPercent > 0,
    is_in_stock: Number(row.stock_quantity || 0) > 0 || !row.track_inventory
  };
}

async function fetchProducts({ limit, status, search }) {
  const pool = getPool();
  const values = [];
  const clauses = [];

  if (status && status !== "all") {
    values.push(status);
    clauses.push(`p.product_status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search.trim().toLowerCase()}%`);
    clauses.push(
      `(lower(p.name) like $${values.length} or lower(coalesce(p.short_description, '')) like $${values.length})`
    );
  }

  values.push(limit);
  const whereClause = clauses.length ? `where ${clauses.join(" and ")}` : "";

  const result = await pool.query(
    `
      select
        p.id,
        p.seller_id,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug,
        u.full_name as seller_name,
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
      join users u on u.id = p.seller_id
      left join product_categories c on c.id = p.category_id
      ${whereClause}
      order by
        p.is_featured desc,
        coalesce(p.published_at, p.created_at) desc,
        p.created_at desc
      limit $${values.length}
    `,
    values
  );

  return result.rows.map(mapProduct);
}

async function listProducts(req, res, next) {
  try {
    const limit = clampLimit(req.query.limit, DEFAULT_LIMIT);
    const status = typeof req.query.status === "string" ? req.query.status : "active";
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const items = await fetchProducts({ limit, status, search });

    res.json({
      items,
      total: items.length
    });
  } catch (error) {
    next(error);
  }
}

async function getHomepageProducts(req, res, next) {
  try {
    const limit = clampLimit(req.query.limit, 48);
    const products = await fetchProducts({
      limit,
      status: "active",
      search: typeof req.query.search === "string" ? req.query.search : ""
    });

    const featuredProducts = products.filter((product) => product.is_featured).slice(0, 10);
    const dealProducts = products.filter((product) => product.is_on_sale).slice(0, 10);
    const inStockProducts = products.filter((product) => product.is_in_stock).slice(0, 12);
    const budgetProducts = products.filter((product) => product.price <= 15000000).slice(0, 10);

    res.json({
      hero_stats: {
        total_products: products.length,
        in_stock_products: products.filter((product) => product.is_in_stock).length,
        featured_products: featuredProducts.length,
        deal_products: dealProducts.length
      },
      spotlight_products: featuredProducts.length ? featuredProducts : products.slice(0, 10),
      deal_products: dealProducts.length ? dealProducts : products.slice(0, 10),
      latest_products: products.slice(0, 12),
      in_stock_products: inStockProducts.length ? inStockProducts : products.slice(0, 12),
      budget_products: budgetProducts.length ? budgetProducts : products.slice(0, 10),
      all_products: products
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHomepageProducts,
  listProducts
};
