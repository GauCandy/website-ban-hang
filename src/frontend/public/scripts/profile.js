(function () {
  const profilePanel = document.querySelector(".profile-panel");

  if (!profilePanel || profilePanel.classList.contains("profile-empty")) {
    return;
  }

  const profileGrid = profilePanel.querySelector(".profile-grid");

  if (!profileGrid) {
    return;
  }

  const profileStats = Array.from(profileGrid.querySelectorAll(".profile-stat"));

  if (profileStats.length < 5) {
    return;
  }

  const editableCards = {
    phone_number: profileStats[2],
    gender: profileStats[3],
    birth_date: profileStats[4]
  };

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

  function formatDateValue(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().slice(0, 10);
  }

  function getGenderOptionsMarkup(selectedGender) {
    const normalizedGender = String(selectedGender || "").trim().toLowerCase();
    const options = [
      ["", "Chưa cập nhật"],
      ["male", "Nam"],
      ["female", "Nữ"]
    ];

    return options
      .map(function (entry) {
        const value = entry[0];
        const label = entry[1];
        const selected = normalizedGender === value ? " selected" : "";
        return `<option value="${value}"${selected}>${label}</option>`;
      })
      .join("");
  }

  function setFeedback(element, message, type) {
    element.textContent = message;
    element.classList.remove("is-error", "is-success");

    if (type) {
      element.classList.add(type === "error" ? "is-error" : "is-success");
    }
  }

  function renderEditor(card, markup) {
    const currentValue = card.querySelector(".profile-stat-value");

    if (!currentValue) {
      return;
    }

    const editor = document.createElement("div");
    editor.className = "profile-stat-editor";
    editor.innerHTML = markup;
    card.classList.add("profile-stat--editable");
    currentValue.replaceWith(editor);
  }

  function mountForm(user) {
    renderEditor(
      editableCards.phone_number,
      `
        <input
          class="profile-input"
          type="tel"
          name="phone_number"
          maxlength="32"
          autocomplete="tel"
          placeholder="Nhập số điện thoại"
          value="${escapeHtml(user.phone_number || "")}"
        />
      `
    );

    renderEditor(
      editableCards.gender,
      `
        <select class="profile-input profile-select" name="gender">
          ${getGenderOptionsMarkup(user.gender)}
        </select>
      `
    );

    renderEditor(
      editableCards.birth_date,
      `
        <input
          class="profile-input"
          type="date"
          name="birth_date"
          value="${formatDateValue(user.birth_date)}"
        />
      `
    );

    const form = document.createElement("form");
    form.className = "profile-inline-form";
    form.setAttribute("novalidate", "novalidate");
    profilePanel.insertBefore(form, profileGrid);
    form.appendChild(profileGrid);

    const actions = document.createElement("div");
    actions.className = "profile-panel-actions";
    actions.innerHTML = `
      <p class="profile-form-feedback" data-profile-feedback role="status" aria-live="polite"></p>
      <div class="profile-form-actions">
        <button class="profile-save-button" type="submit" data-profile-submit>Lưu thay đổi</button>
      </div>
    `;
    form.appendChild(actions);

    form.addEventListener("submit", handleSubmit);
  }

  async function fetchCurrentUser() {
    const response = await fetch("/api/users/me", {
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      const payload = await response.json().catch(function () {
        return null;
      });

      throw new Error(payload?.message || "Không tải được thông tin tài khoản.");
    }

    const payload = await response.json().catch(function () {
      return null;
    });

    if (!payload?.user) {
      throw new Error("Không tìm thấy dữ liệu người dùng.");
    }

    return payload.user;
  }

  function readPayload(form) {
    const formData = new FormData(form);

    return {
      phone_number: String(formData.get("phone_number") || "").trim(),
      gender: String(formData.get("gender") || "").trim(),
      birth_date: String(formData.get("birth_date") || "").trim()
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const feedback = form.querySelector("[data-profile-feedback]");
    const submitButton = form.querySelector("[data-profile-submit]");
    const payload = readPayload(form);
    const originalLabel = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = "Đang lưu...";
    setFeedback(feedback, "", null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responsePayload = await response.json().catch(function () {
        return null;
      });

      if (!response.ok) {
        throw new Error(responsePayload?.message || "Không thể cập nhật profile.");
      }

      setFeedback(feedback, "Đã lưu thay đổi. Trang sẽ làm mới ngay.", "success");

      window.setTimeout(function () {
        window.location.reload();
      }, 500);
    } catch (error) {
      setFeedback(
        feedback,
        error?.message || "Đã xảy ra lỗi khi cập nhật thông tin.",
        "error"
      );
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  }

  fetchCurrentUser()
    .then(function (user) {
      mountForm(user);
    })
    .catch(function (error) {
      const actions = document.createElement("div");
      actions.className = "profile-panel-actions";
      actions.innerHTML = `
        <p class="profile-form-feedback is-error">${escapeHtml(
          error?.message || "Không thể tải tính năng cập nhật."
        )}</p>
      `;
      profilePanel.appendChild(actions);
    });
})();
