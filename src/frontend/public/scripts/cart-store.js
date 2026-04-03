(function (global) {
  var EVENT_NAME = "gatecat:cart-updated";
  var EMPTY_CART = {
    id: null,
    count: 0,
    subtotal: 0,
    currency_code: "VND",
    items: []
  };
  var cache = normalizeCart(EMPTY_CART);
  var loaded = false;
  var pendingLoad = null;

  function cloneCart(cart) {
    return normalizeCart(cart);
  }

  function normalizeCart(cart) {
    var source = cart && typeof cart === "object" ? cart : EMPTY_CART;
    var items = Array.isArray(source.items)
      ? source.items.map(function (item) {
          return {
            id: item && item.id ? item.id : null,
            product_id: item && item.product_id ? item.product_id : item && item.id ? item.id : null,
            slug: item && item.slug ? item.slug : "",
            name: item && item.name ? item.name : "",
            sku: item && item.sku ? item.sku : null,
            price: Number(item && item.price ? item.price : 0),
            compare_at_price:
              item && item.compare_at_price != null ? Number(item.compare_at_price) : null,
            currency_code: item && item.currency_code ? item.currency_code : "VND",
            cover_image_url: item && item.cover_image_url ? item.cover_image_url : "",
            quantity: Number(item && item.quantity ? item.quantity : 0),
            stock_quantity: Number(item && item.stock_quantity != null ? item.stock_quantity : 0),
            track_inventory: item ? item.track_inventory !== false : true,
            product_status: item && item.product_status ? item.product_status : "active",
            max_quantity: Number(item && item.max_quantity != null ? item.max_quantity : 0),
            is_in_stock: Boolean(item && item.is_in_stock),
            can_update_quantity: Boolean(item && item.can_update_quantity),
            discount_percent: Number(item && item.discount_percent ? item.discount_percent : 0),
            line_subtotal: Number(item && item.line_subtotal ? item.line_subtotal : 0)
          };
        })
      : [];

    return {
      id: source.id || null,
      count: Number(source.count || 0),
      subtotal: Number(source.subtotal || 0),
      currency_code: source.currency_code || "VND",
      items: items
    };
  }

  function snapshot() {
    return cloneCart(cache);
  }

  function emitUpdate(nextCart) {
    var detail = cloneCart(nextCart || cache);

    try {
      global.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: detail }));
    } catch (_error) {
      var event = document.createEvent("CustomEvent");
      event.initCustomEvent(EVENT_NAME, false, false, detail);
      global.dispatchEvent(event);
    }
  }

  function syncCart(nextCart, shouldEmit) {
    cache = normalizeCart(nextCart);
    loaded = true;

    if (shouldEmit !== false) {
      emitUpdate(cache);
    }

    return snapshot();
  }

  function readPayload(response) {
    return response
      .text()
      .then(function (text) {
        if (!text) return {};

        try {
          return JSON.parse(text);
        } catch (_error) {
          return {};
        }
      })
      .catch(function () {
        return {};
      });
  }

  function buildErrorResult(message, reason) {
    return {
      ok: false,
      status: 0,
      reason: reason || "network_error",
      message: message || "Khong the ket noi den may chu.",
      cart: snapshot(),
      adjusted: false
    };
  }

  function request(url, options) {
    var requestOptions = {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    };

    if (options && options.method) {
      requestOptions.method = options.method;
    }

    if (options && options.headers) {
      Object.keys(options.headers).forEach(function (key) {
        requestOptions.headers[key] = options.headers[key];
      });
    }

    if (options && Object.prototype.hasOwnProperty.call(options, "body")) {
      requestOptions.body = options.body;
    }

    return fetch(url, requestOptions)
      .then(function (response) {
        return readPayload(response).then(function (payload) {
          if (payload && payload.cart) {
            syncCart(payload.cart, true);
          }

          return {
            ok: response.ok,
            status: response.status,
            reason: payload && payload.reason ? payload.reason : null,
            message: payload && payload.message ? payload.message : "",
            adjusted: Boolean(payload && payload.adjusted),
            cart: snapshot()
          };
        });
      })
      .catch(function () {
        return buildErrorResult();
      });
  }

  function load(force) {
    if (loaded && !force) {
      return Promise.resolve(snapshot());
    }

    if (pendingLoad && !force) {
      return pendingLoad;
    }

    pendingLoad = request("/api/cart")
      .then(function (result) {
        pendingLoad = null;

        if (!result.ok) {
          throw result;
        }

        return result.cart;
      })
      .catch(function (error) {
        pendingLoad = null;
        throw error;
      });

    return pendingLoad;
  }

  function add(productOrId, quantity) {
    var productId =
      typeof productOrId === "string"
        ? productOrId
        : productOrId && productOrId.id
          ? productOrId.id
          : null;

    if (!productId) {
      return Promise.resolve({
        ok: false,
        status: 0,
        reason: "invalid_product",
        message: "San pham khong hop le.",
        adjusted: false,
        cart: snapshot()
      });
    }

    return request("/api/cart/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: Number(quantity || 1)
      })
    });
  }

  function updateQuantity(productId, quantity) {
    if (!productId) {
      return Promise.resolve(buildErrorResult("Ma san pham khong hop le.", "invalid_product"));
    }

    return request("/api/cart/items/" + encodeURIComponent(productId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantity: Number(quantity || 0)
      })
    });
  }

  function remove(productId) {
    if (!productId) {
      return Promise.resolve(buildErrorResult("Ma san pham khong hop le.", "invalid_product"));
    }

    return request("/api/cart/items/" + encodeURIComponent(productId), {
      method: "DELETE"
    });
  }

  function clear() {
    return request("/api/cart", {
      method: "DELETE"
    });
  }

  global.GateCatCart = {
    eventName: EVENT_NAME,
    add: add,
    clear: clear,
    isLoaded: function () {
      return loaded;
    },
    load: load,
    remove: remove,
    snapshot: snapshot,
    updateQuantity: updateQuantity
  };
})(window);
