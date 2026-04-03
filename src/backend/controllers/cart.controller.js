const crypto = require("crypto");
const env = require("../config/env");
const { getPool } = require("../db/pool");
const { parseCookies, serializeCookie } = require("../lib/cookies");
const { readJwt } = require("../lib/jwt");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALLBACK_MAX_QUANTITY = 99;
const CART_SESSION_COOKIE = env.secureCookies
  ? "__Host-whitecat_cart_session"
  : "whitecat_cart_session";
const CART_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function createHttpError(statusCode, message, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  Object.assign(error, extras);
  return error;
}

function isUuid(value) {
  return UUID_PATTERN.test(String(value || "").trim());
}

function parseRequestBody(body) {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body;
  }

  throw createHttpError(400, "Body request khong hop le.");
}

function normalizeProductId(value) {
  const normalized = String(value || "").trim();

  if (!isUuid(normalized)) {
    throw createHttpError(400, "Ma san pham khong hop le.");
  }

  return normalized;
}

function normalizeQuantity(value, options = {}) {
  const allowZero = options.allowZero === true;
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || (!allowZero && parsed <= 0)) {
    throw createHttpError(
      400,
      allowZero
        ? "So luong phai la so nguyen khong am."
        : "So luong phai la so nguyen duong."
    );
  }

  return parsed;
}

function buildCartCookie(sessionId) {
  return serializeCookie(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: CART_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "Lax",
    secure: env.secureCookies
  });
}

function clearCartCookie() {
  return serializeCookie(CART_SESSION_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
    sameSite: "Lax",
    secure: env.secureCookies
  });
}

function applyResponseCookies(res, cookies) {
  if (!Array.isArray(cookies) || !cookies.length) {
    return;
  }

  const existing = res.getHeader("Set-Cookie");
  const nextCookies = Array.isArray(existing)
    ? existing.concat(cookies)
    : existing
      ? [existing].concat(cookies)
      : cookies;

  res.setHeader("Set-Cookie", nextCookies);
}

function getMaxQuantity(product) {
  if (!product || product.product_status !== "active") {
    return 0;
  }

  if (product.track_inventory === false) {
    return FALLBACK_MAX_QUANTITY;
  }

  const stock = Number(product.stock_quantity);

  if (!Number.isFinite(stock) || stock === -1) {
    return FALLBACK_MAX_QUANTITY;
  }

  return Math.max(0, stock);
}

function mapCartItem(row) {
  const price = Number(row.price || 0);
  const compareAtPrice = row.compare_at_price == null ? null : Number(row.compare_at_price);
  const quantity = Number(row.quantity || 0);
  const maxQuantity = getMaxQuantity(row);
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  return {
    id: row.product_id,
    product_id: row.product_id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    price,
    compare_at_price: compareAtPrice,
    currency_code: row.currency_code,
    cover_image_url: row.cover_image_url || "",
    quantity,
    stock_quantity: Number(row.stock_quantity || 0),
    track_inventory: row.track_inventory,
    product_status: row.product_status,
    max_quantity: maxQuantity,
    is_in_stock: maxQuantity > 0,
    can_update_quantity: maxQuantity > 0,
    discount_percent: discountPercent,
    line_subtotal: price * quantity
  };
}

async function fetchCartSummary(client, cartId) {
  if (!cartId) {
    return {
      id: null,
      count: 0,
      subtotal: 0,
      currency_code: "VND",
      items: []
    };
  }

  const result = await client.query(
    `
      select
        ci.product_id,
        ci.quantity,
        ci.created_at as item_created_at,
        ci.updated_at as item_updated_at,
        p.slug,
        p.name,
        p.sku,
        p.price,
        p.compare_at_price,
        p.currency_code,
        p.stock_quantity,
        p.track_inventory,
        p.product_status,
        p.cover_image_url
      from shopping_cart_items ci
      join products p on p.id = ci.product_id
      where ci.cart_id = $1
      order by ci.updated_at desc, ci.created_at desc
    `,
    [cartId]
  );

  const items = result.rows.map(mapCartItem);
  const count = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const subtotal = items.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return {
    id: cartId,
    count,
    subtotal,
    currency_code: items[0]?.currency_code || "VND",
    items
  };
}

async function resolveAuthenticatedUser(req) {
  if (req.currentUser?.id) {
    return req.currentUser;
  }

  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[env.jwtCookieName];

  if (!token) {
    return null;
  }

  const jwtPayload = readJwt(token, env.jwtSecret);

  if (!jwtPayload?.sub || !isUuid(jwtPayload.sub)) {
    return null;
  }

  const result = await getPool().query(
    `
      select
        u.id,
        u.full_name,
        u.email
      from users u
      where u.id = $1
        and exists(
          select 1
          from auth_identities ai
          where ai.user_id = u.id
        )
      limit 1
    `,
    [jwtPayload.sub]
  );

  if (!result.rowCount) {
    return null;
  }

  req.currentUser = result.rows[0];
  req.auth = jwtPayload;
  return req.currentUser;
}

async function findCartByUserId(client, userId) {
  const result = await client.query(
    `
      select id, user_id, session_id
      from shopping_carts
      where user_id = $1
      limit 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findCartBySessionId(client, sessionId) {
  const result = await client.query(
    `
      select id, user_id, session_id
      from shopping_carts
      where session_id = $1
      limit 1
    `,
    [sessionId]
  );

  return result.rows[0] || null;
}

async function createCartForUser(client, userId) {
  try {
    const result = await client.query(
      `
        insert into shopping_carts (user_id)
        values ($1)
        returning id, user_id, session_id
      `,
      [userId]
    );

    return result.rows[0];
  } catch (error) {
    if (error?.code === "23505") {
      return findCartByUserId(client, userId);
    }

    throw error;
  }
}

async function createCartForSession(client, sessionId) {
  try {
    const result = await client.query(
      `
        insert into shopping_carts (session_id)
        values ($1)
        returning id, user_id, session_id
      `,
      [sessionId]
    );

    return result.rows[0];
  } catch (error) {
    if (error?.code === "23505") {
      return findCartBySessionId(client, sessionId);
    }

    throw error;
  }
}

async function getOrCreateUserCart(client, userId) {
  const existingCart = await findCartByUserId(client, userId);
  return existingCart || createCartForUser(client, userId);
}

async function getOrCreateSessionCart(client, sessionId) {
  const existingCart = await findCartBySessionId(client, sessionId);
  return existingCart || createCartForSession(client, sessionId);
}

async function touchCart(client, cartId) {
  await client.query(
    `
      update shopping_carts
      set updated_at = now()
      where id = $1
    `,
    [cartId]
  );
}

async function mergeCartItems(client, targetCartId, sourceCartId) {
  if (!targetCartId || !sourceCartId || targetCartId === sourceCartId) {
    return;
  }

  const sourceItems = await client.query(
    `
      select product_id, quantity
      from shopping_cart_items
      where cart_id = $1
    `,
    [sourceCartId]
  );

  for (const row of sourceItems.rows) {
    await client.query(
      `
        insert into shopping_cart_items (cart_id, product_id, quantity)
        values ($1, $2, $3)
        on conflict (cart_id, product_id)
        do update set
          quantity = shopping_cart_items.quantity + excluded.quantity,
          updated_at = now()
      `,
      [targetCartId, row.product_id, row.quantity]
    );
  }

  await client.query(
    `
      delete from shopping_carts
      where id = $1
    `,
    [sourceCartId]
  );

  await touchCart(client, targetCartId);
}

async function queryProductForCart(client, productId) {
  const result = await client.query(
    `
      select
        id,
        slug,
        name,
        sku,
        price,
        compare_at_price,
        currency_code,
        stock_quantity,
        track_inventory,
        product_status,
        cover_image_url
      from products
      where id = $1
      limit 1
    `,
    [productId]
  );

  return result.rows[0] || null;
}

async function resolveCartContext(client, req, options = {}) {
  const createIfMissing = options.createIfMissing === true;
  const refreshGuestCookie = options.refreshGuestCookie === true;
  const cookies = parseCookies(req.headers.cookie || "");
  const rawSessionId = cookies[CART_SESSION_COOKIE];
  const sessionId = isUuid(rawSessionId) ? rawSessionId : null;
  const user = await resolveAuthenticatedUser(req);
  const responseCookies = [];
  let cart = null;

  if (user?.id) {
    cart = createIfMissing
      ? await getOrCreateUserCart(client, user.id)
      : await findCartByUserId(client, user.id);

    if (rawSessionId) {
      if (!cart && createIfMissing) {
        cart = await createCartForUser(client, user.id);
      }

      if (sessionId) {
        const sessionCart = await findCartBySessionId(client, sessionId);

        if (sessionCart && (!cart || sessionCart.id !== cart.id)) {
          if (!cart) {
            cart = await createCartForUser(client, user.id);
          }

          await mergeCartItems(client, cart.id, sessionCart.id);
        }
      }

      responseCookies.push(clearCartCookie());
    }

    return {
      cart,
      responseCookies,
      user
    };
  }

  if (rawSessionId && !sessionId) {
    responseCookies.push(clearCartCookie());
  }

  if (!sessionId) {
    if (!createIfMissing) {
      return {
        cart: null,
        responseCookies,
        user: null
      };
    }

    const nextSessionId = crypto.randomUUID();
    cart = await createCartForSession(client, nextSessionId);
    responseCookies.push(buildCartCookie(nextSessionId));

    return {
      cart,
      responseCookies,
      user: null
    };
  }

  cart = createIfMissing
    ? await getOrCreateSessionCart(client, sessionId)
    : await findCartBySessionId(client, sessionId);

  if (!cart && !createIfMissing) {
    responseCookies.push(clearCartCookie());
  } else if (refreshGuestCookie) {
    responseCookies.push(buildCartCookie(sessionId));
  }

  return {
    cart,
    responseCookies,
    user: null
  };
}

async function getCart(req, res, next) {
  const client = await getPool().connect();

  try {
    const context = await resolveCartContext(client, req, { createIfMissing: false });
    const cart = await fetchCartSummary(client, context.cart?.id || null);

    applyResponseCookies(res, context.responseCookies);
    res.json({ cart });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
}

async function addCartItem(req, res, next) {
  const client = await getPool().connect();

  try {
    const body = parseRequestBody(req.body);
    const productId = normalizeProductId(body.product_id);
    const quantity = normalizeQuantity(body.quantity == null ? 1 : body.quantity);

    await client.query("begin");
    const context = await resolveCartContext(client, req, {
      createIfMissing: true,
      refreshGuestCookie: true
    });
    const product = await queryProductForCart(client, productId);

    if (!product || product.product_status !== "active") {
      throw createHttpError(404, "San pham khong ton tai hoac khong con hoat dong.");
    }

    const maxQuantity = getMaxQuantity(product);

    if (maxQuantity <= 0) {
      throw createHttpError(409, "San pham hien da het hang.", { reason: "out_of_stock" });
    }

    const existingItem = await client.query(
      `
        select quantity
        from shopping_cart_items
        where cart_id = $1 and product_id = $2
        limit 1
      `,
      [context.cart.id, productId]
    );

    const previousQuantity = existingItem.rowCount ? Number(existingItem.rows[0].quantity || 0) : 0;

    if (previousQuantity >= maxQuantity) {
      throw createHttpError(409, "So luong da dat toi gioi han ton kho.", {
        reason: "limit_reached"
      });
    }

    const requestedQuantity = previousQuantity + quantity;
    const nextQuantity = Math.min(requestedQuantity, maxQuantity);

    await client.query(
      `
        insert into shopping_cart_items (cart_id, product_id, quantity)
        values ($1, $2, $3)
        on conflict (cart_id, product_id)
        do update set
          quantity = excluded.quantity,
          updated_at = now()
      `,
      [context.cart.id, productId, nextQuantity]
    );

    await touchCart(client, context.cart.id);
    const cart = await fetchCartSummary(client, context.cart.id);
    await client.query("commit");

    applyResponseCookies(res, context.responseCookies);
    res.status(201).json({
      message:
        nextQuantity < requestedQuantity
          ? "Da them vao gio hang va gioi han theo ton kho hien co."
          : "Da them san pham vao gio hang.",
      adjusted: nextQuantity < requestedQuantity,
      cart
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});

    if (error?.expose && error?.statusCode) {
      const context = await resolveCartContext(client, req, { createIfMissing: false }).catch(
        () => null
      );
      const cart = context?.cart ? await fetchCartSummary(client, context.cart.id).catch(() => null) : null;

      if (context?.responseCookies?.length) {
        applyResponseCookies(res, context.responseCookies);
      }

      res.status(error.statusCode).json({
        message: error.message,
        reason: error.reason || null,
        cart
      });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function updateCartItem(req, res, next) {
  const client = await getPool().connect();

  try {
    const productId = normalizeProductId(req.params.productId);
    const body = parseRequestBody(req.body);
    const quantity = normalizeQuantity(body.quantity, { allowZero: true });

    await client.query("begin");
    const context = await resolveCartContext(client, req, {
      createIfMissing: false,
      refreshGuestCookie: true
    });

    if (!context.cart) {
      throw createHttpError(404, "Khong tim thay gio hang.");
    }

    const existingItem = await client.query(
      `
        select quantity
        from shopping_cart_items
        where cart_id = $1 and product_id = $2
        limit 1
      `,
      [context.cart.id, productId]
    );

    if (!existingItem.rowCount) {
      throw createHttpError(404, "San pham khong ton tai trong gio hang.");
    }

    if (quantity === 0) {
      await client.query(
        `
          delete from shopping_cart_items
          where cart_id = $1 and product_id = $2
        `,
        [context.cart.id, productId]
      );

      await touchCart(client, context.cart.id);
      const cart = await fetchCartSummary(client, context.cart.id);
      await client.query("commit");

      applyResponseCookies(res, context.responseCookies);
      res.json({
        message: "Da xoa san pham khoi gio hang.",
        cart
      });
      return;
    }

    const product = await queryProductForCart(client, productId);

    if (!product || product.product_status !== "active") {
      throw createHttpError(409, "San pham khong con hoat dong.", { reason: "unavailable" });
    }

    const maxQuantity = getMaxQuantity(product);

    if (maxQuantity <= 0) {
      throw createHttpError(409, "San pham hien da het hang.", { reason: "out_of_stock" });
    }

    const nextQuantity = Math.min(quantity, maxQuantity);

    await client.query(
      `
        update shopping_cart_items
        set quantity = $1, updated_at = now()
        where cart_id = $2 and product_id = $3
      `,
      [nextQuantity, context.cart.id, productId]
    );

    await touchCart(client, context.cart.id);
    const cart = await fetchCartSummary(client, context.cart.id);
    await client.query("commit");

    applyResponseCookies(res, context.responseCookies);
    res.json({
      message:
        nextQuantity < quantity
          ? "Da cap nhat so luong va gioi han theo ton kho hien co."
          : "Da cap nhat gio hang.",
      adjusted: nextQuantity < quantity,
      cart
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});

    if (error?.expose && error?.statusCode) {
      const context = await resolveCartContext(client, req, { createIfMissing: false }).catch(
        () => null
      );
      const cart = context?.cart ? await fetchCartSummary(client, context.cart.id).catch(() => null) : null;

      if (context?.responseCookies?.length) {
        applyResponseCookies(res, context.responseCookies);
      }

      res.status(error.statusCode).json({
        message: error.message,
        reason: error.reason || null,
        cart
      });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function removeCartItem(req, res, next) {
  const client = await getPool().connect();

  try {
    const productId = normalizeProductId(req.params.productId);

    await client.query("begin");
    const context = await resolveCartContext(client, req, {
      createIfMissing: false,
      refreshGuestCookie: true
    });

    if (!context.cart) {
      const emptyCart = await fetchCartSummary(client, null);
      await client.query("commit");

      applyResponseCookies(res, context.responseCookies);
      res.json({
        message: "Gio hang dang trong.",
        cart: emptyCart
      });
      return;
    }

    await client.query(
      `
        delete from shopping_cart_items
        where cart_id = $1 and product_id = $2
      `,
      [context.cart.id, productId]
    );

    await touchCart(client, context.cart.id);
    const cart = await fetchCartSummary(client, context.cart.id);
    await client.query("commit");

    applyResponseCookies(res, context.responseCookies);
    res.json({
      message: "Da xoa san pham khoi gio hang.",
      cart
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

async function clearCart(req, res, next) {
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const context = await resolveCartContext(client, req, {
      createIfMissing: false,
      refreshGuestCookie: true
    });

    if (context.cart) {
      await client.query(
        `
          delete from shopping_cart_items
          where cart_id = $1
        `,
        [context.cart.id]
      );

      await touchCart(client, context.cart.id);
    }

    const cart = await fetchCartSummary(client, context.cart?.id || null);
    await client.query("commit");

    applyResponseCookies(res, context.responseCookies);
    res.json({
      message: "Da xoa tat ca san pham trong gio hang.",
      cart
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem
};
