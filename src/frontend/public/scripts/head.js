(function () {
  const menus = Array.from(document.querySelectorAll("[data-account-menu]"));

  if (!menus.length) {
    return;
  }

  function getToggle(menu) {
    return menu.querySelector("[data-account-toggle]");
  }

  function setOpen(menu, open) {
    menu.dataset.open = open ? "true" : "false";

    const toggle = getToggle(menu);

    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  function closeOtherMenus(currentMenu) {
    for (const menu of menus) {
      if (menu !== currentMenu) {
        setOpen(menu, false);
      }
    }
  }

  for (const menu of menus) {
    const toggle = getToggle(menu);

    if (!toggle) {
      continue;
    }

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = menu.dataset.open !== "true";
      closeOtherMenus(menu);
      setOpen(menu, willOpen);
    });

    menu.addEventListener("mouseenter", () => {
      closeOtherMenus(menu);
      setOpen(menu, true);
    });

    menu.addEventListener("mouseleave", () => {
      setOpen(menu, false);
    });

    menu.addEventListener("focusin", () => {
      closeOtherMenus(menu);
      setOpen(menu, true);
    });

    menu.addEventListener("focusout", () => {
      window.requestAnimationFrame(() => {
        if (!menu.contains(document.activeElement)) {
          setOpen(menu, false);
        }
      });
    });
  }

  document.addEventListener("click", (event) => {
    for (const menu of menus) {
      if (!menu.contains(event.target)) {
        setOpen(menu, false);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    for (const menu of menus) {
      setOpen(menu, false);

      const toggle = getToggle(menu);

      if (toggle && menu.contains(document.activeElement)) {
        toggle.focus();
      }
    }
  });

  for (const menu of menus) {
    setOpen(menu, false);
  }
})();

/* ─── Header search ──────────────────────────────── */
(function () {
  var searchEl = document.querySelector("[data-header-search]");
  if (!searchEl) return;

  var input = searchEl.querySelector(".header-search-input");
  var results = searchEl.querySelector("[data-search-results]");
  var form = searchEl.querySelector(".header-search-form");
  var debounceTimer = null;

  function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str || "")));
    return div.innerHTML;
  }

  function doSearch(query) {
    query = query.trim();
    if (!query) {
      results.hidden = true;
      return;
    }

    fetch("/api/products?status=active&limit=8&search=" + encodeURIComponent(query), {
      headers: { Accept: "application/json" }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) {
          results.innerHTML = '<div class="search-no-result">Không tìm thấy sản phẩm nào</div>';
          results.hidden = false;
          return;
        }

        var html = "";
        items.forEach(function (p) {
          var imgHtml = p.cover_image_url
            ? '<img class="search-result-img" src="' + escapeHtml(p.cover_image_url) + '" alt="" loading="lazy" />'
            : '<div class="search-result-img"></div>';
          html +=
            '<a class="search-result-item" href="/product/' + encodeURIComponent(p.slug || p.id) + '">' +
            imgHtml +
            '<div class="search-result-info">' +
            '<div class="search-result-name">' + escapeHtml(p.name) + '</div>' +
            '<div class="search-result-price">' + formatPrice(p.price) + '</div>' +
            '</div></a>';
        });

        html += '<a class="search-view-all" href="/search?q=' + encodeURIComponent(query) + '">Xem tất cả kết quả</a>';
        results.innerHTML = html;
        results.hidden = false;
      })
      .catch(function () {
        results.hidden = true;
      });
  }

  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      doSearch(input.value);
    }, 300);
  });

  input.addEventListener("focus", function () {
    if (input.value.trim()) doSearch(input.value);
  });

  document.addEventListener("click", function (e) {
    if (!searchEl.contains(e.target)) results.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (q) window.location.href = "/search?q=" + encodeURIComponent(q);
  });
})();
