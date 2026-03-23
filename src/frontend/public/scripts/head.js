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
