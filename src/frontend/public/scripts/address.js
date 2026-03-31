(function () {
  const root = document.querySelector("[data-address-root]");

  if (!root) {
    return;
  }

  const state = {
    user: null,
    addresses: [],
    editingAddressId: null,
    isFormOpen: false,
    feedback: null,
    confirmDeleteAddressId: null,
    deletingAddressId: null
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

  function parseJson(response) {
    return response.json().catch(function () {
      return null;
    });
  }

  function setFeedback(message, type) {
    state.feedback = message
      ? {
          message,
          type: type === "error" ? "error" : "success"
        }
      : null;
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

  async function fetchAddresses() {
    const response = await fetch("/api/users/me/addresses", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (response.status === 401) {
      return [];
    }

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Không tải được danh sách địa chỉ.");
    }

    return Array.isArray(payload?.items) ? payload.items : [];
  }

  function getEditingAddress() {
    if (!state.editingAddressId) {
      return null;
    }

    return (
      state.addresses.find(function (address) {
        return String(address.id) === String(state.editingAddressId);
      }) || null
    );
  }

  function getFormState() {
    const editingAddress = getEditingAddress();

    if (editingAddress) {
      return {
        title: "Sửa địa chỉ",
        submitLabel: "Lưu",
        values: {
          label: editingAddress.label || "",
          recipient_name: editingAddress.recipient_name || "",
          phone_number: editingAddress.phone_number || "",
          state_or_province: editingAddress.state_or_province || "",
          district: editingAddress.district || "",
          ward: editingAddress.ward || "",
          address_line_1: editingAddress.address_line_1 || "",
          address_line_2: editingAddress.address_line_2 || "",
          delivery_notes: editingAddress.delivery_notes || "",
          is_default: Boolean(editingAddress.is_default)
        }
      };
    }

    return {
      title: "Thêm địa chỉ",
      submitLabel: "Thêm địa chỉ",
      values: {
        label: "",
        recipient_name: state.user?.full_name || "",
        phone_number: state.user?.phone_number || "",
        state_or_province: "",
        district: "",
        ward: "",
        address_line_1: "",
        address_line_2: "",
        delivery_notes: "",
        is_default: state.addresses.length === 0
      }
    };
  }

  function buildAddressText(address) {
    return [
      address.address_line_1,
      address.address_line_2,
      address.ward,
      address.district,
      address.state_or_province
    ]
      .filter(Boolean)
      .join(", ");
  }

  function upsertAddress(nextAddress) {
    const nextId = String(nextAddress?.id || "");
    const existingIndex = state.addresses.findIndex(function (address) {
      return String(address.id) === nextId;
    });

    if (existingIndex >= 0) {
      state.addresses[existingIndex] = nextAddress;
      return;
    }

    state.addresses = [nextAddress].concat(state.addresses);
  }

  function removeAddressFromState(addressId) {
    const targetId = String(addressId || "");

    state.addresses = state.addresses.filter(function (address) {
      return String(address.id) !== targetId;
    });
  }

  function applyDefaultAddress(addressId) {
    const targetId = String(addressId || "");

    state.addresses = state.addresses.map(function (address) {
      return Object.assign({}, address, {
        is_default: String(address.id) === targetId
      });
    });
  }

  function buildAddressCard(address, isPrimary) {
    return `
      <article class="address-card ${isPrimary ? "is-primary" : ""}">
        <div class="address-card-head">
          <div>
            <p class="address-card-label">${escapeHtml(address.label || "Địa chỉ")}</p>
            <p class="address-card-person">${escapeHtml(address.recipient_name)} - ${escapeHtml(
      address.phone_number
    )}</p>
          </div>
          <span class="address-badge">${isPrimary ? "Chính" : "Phụ"}</span>
        </div>
        <p class="address-card-line">${escapeHtml(buildAddressText(address))}</p>
        ${
          address.delivery_notes
            ? `<p class="address-card-note">${escapeHtml(address.delivery_notes)}</p>`
            : ""
        }
        <div class="address-card-actions">
          <button class="address-action" type="button" data-address-edit="${address.id}">Sửa</button>
          ${
            isPrimary
              ? ""
              : `<button class="address-action" type="button" data-address-default="${address.id}">Đặt làm chính</button>`
          }
          <button class="address-action address-action--danger" type="button" data-address-delete="${address.id}">Xóa</button>
        </div>
      </article>
    `;
  }

  function buildGuestMarkup() {
    return `
      <div class="address-panel address-panel--empty">
        <h1 class="address-title">Địa chỉ</h1>
        <p class="address-copy">Đăng nhập để xem và thêm địa chỉ giao hàng.</p>
        <a class="profile-login-link" href="/auth/google">Đăng nhập với Google</a>
      </div>
    `;
  }

  function buildAddressFormModal(formState, feedbackMarkup) {
    if (!state.isFormOpen) {
      return "";
    }

    return `
      <div class="address-modal-backdrop" data-address-close></div>
      <section class="address-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(
        formState.title
      )}">
        <div class="address-modal-head">
          <h2 class="address-section-title">${escapeHtml(formState.title)}</h2>
          <button class="address-modal-close" type="button" data-address-close aria-label="Đóng">
            Đóng
          </button>
        </div>

        <form class="address-form" data-address-form novalidate>
          <div class="address-form-grid">
            <label class="address-field">
              <span class="address-field-label">Tên địa chỉ</span>
              <input class="profile-input" type="text" name="label" maxlength="100" value="${escapeHtml(
                formState.values.label
              )}" placeholder="Ví dụ: Nhà, Công ty" />
            </label>

            <label class="address-field">
              <span class="address-field-label">Người nhận</span>
              <input class="profile-input" type="text" name="recipient_name" maxlength="255" value="${escapeHtml(
                formState.values.recipient_name
              )}" required />
            </label>

            <label class="address-field">
              <span class="address-field-label">Số điện thoại</span>
              <input class="profile-input" type="tel" name="phone_number" maxlength="32" value="${escapeHtml(
                formState.values.phone_number
              )}" required />
            </label>

            <label class="address-field">
              <span class="address-field-label">Tỉnh / Thành phố</span>
              <input class="profile-input" type="text" name="state_or_province" maxlength="120" value="${escapeHtml(
                formState.values.state_or_province
              )}" required />
            </label>

            <label class="address-field">
              <span class="address-field-label">Quận / Huyện</span>
              <input class="profile-input" type="text" name="district" maxlength="120" value="${escapeHtml(
                formState.values.district
              )}" />
            </label>

            <label class="address-field">
              <span class="address-field-label">Phường / Xã</span>
              <input class="profile-input" type="text" name="ward" maxlength="120" value="${escapeHtml(
                formState.values.ward
              )}" />
            </label>

            <label class="address-field address-field--full">
              <span class="address-field-label">Địa chỉ chi tiết</span>
              <input class="profile-input" type="text" name="address_line_1" maxlength="255" value="${escapeHtml(
                formState.values.address_line_1
              )}" required />
            </label>

            <label class="address-field address-field--full">
              <span class="address-field-label">Thông tin bổ sung</span>
              <input class="profile-input" type="text" name="address_line_2" maxlength="255" value="${escapeHtml(
                formState.values.address_line_2
              )}" />
            </label>

            <label class="address-field address-field--full">
              <span class="address-field-label">Ghi chú</span>
              <textarea class="profile-input address-textarea" name="delivery_notes" maxlength="1000">${escapeHtml(
                formState.values.delivery_notes
              )}</textarea>
            </label>
          </div>

          <label class="address-default-toggle">
            <input type="checkbox" name="is_default" ${formState.values.is_default ? "checked" : ""} />
            <span>Đặt làm địa chỉ chính</span>
          </label>

          <div class="address-form-actions-row">
            ${feedbackMarkup}
            <div class="address-form-actions">
              <button class="address-action" type="button" data-address-close>Hủy</button>
              <button class="profile-save-button" type="submit" data-address-submit>${escapeHtml(
                formState.submitLabel
              )}</button>
            </div>
          </div>
        </form>
      </section>
    `;
  }

  function buildDeleteConfirmModal() {
    if (!state.confirmDeleteAddressId) {
      return "";
    }

    const address = state.addresses.find(function (item) {
      return String(item.id) === String(state.confirmDeleteAddressId);
    });
    const isDeleting = String(state.deletingAddressId || "") === String(state.confirmDeleteAddressId);

    return `
      <div class="address-modal-backdrop" data-address-delete-cancel></div>
      <section class="address-modal address-modal--confirm" role="dialog" aria-modal="true" aria-label="Xác nhận xóa địa chỉ">
        <div class="address-modal-head">
          <h2 class="address-section-title">Xác nhận xóa địa chỉ</h2>
          <button class="address-modal-close" type="button" data-address-delete-cancel aria-label="Đóng">
            Đóng
          </button>
        </div>

        <div class="address-confirm-copy">
          <p class="address-copy">Bạn có chắc muốn xóa địa chỉ này không?</p>
          ${
            address
              ? `<p class="address-confirm-summary">${escapeHtml(address.label || "Địa chỉ")} - ${escapeHtml(
                  buildAddressText(address)
                )}</p>`
              : ""
          }
        </div>

        <div class="address-form-actions">
          <button class="address-action" type="button" data-address-delete-cancel>Hủy</button>
          <button class="address-action address-action--danger" type="button" data-address-delete-confirm ${
            isDeleting ? "disabled" : ""
          }>${isDeleting ? "Đang xóa..." : "Xóa địa chỉ"}</button>
        </div>
      </section>
    `;
  }

  function buildAddressPageMarkup() {
    const formState = getFormState();
    const primaryAddress =
      state.addresses.find(function (address) {
        return address.is_default;
      }) || null;
    const secondaryAddresses = state.addresses.filter(function (address) {
      return !address.is_default;
    });
    const feedbackMarkup = state.feedback
      ? `<p class="profile-form-feedback ${
          state.feedback.type === "error" ? "is-error" : "is-success"
        }" role="status" aria-live="polite">${escapeHtml(state.feedback.message)}</p>`
      : '<p class="profile-form-feedback" role="status" aria-live="polite"></p>';

    return `
      <div class="address-panel">
        <div class="address-heading">
          <div>
            <h1 class="address-title">Địa chỉ</h1>
            <p class="address-copy">Địa chỉ chính, địa chỉ phụ và thêm địa chỉ mới.</p>
          </div>
          <button class="address-primary-button" type="button" data-address-create>Thêm địa chỉ</button>
        </div>

        <div class="address-simple-layout">
          <section class="address-section">
            <h2 class="address-section-title">Địa chỉ chính</h2>
            ${
              primaryAddress
                ? buildAddressCard(primaryAddress, true)
                : '<p class="address-empty-text">Chưa có địa chỉ chính.</p>'
            }
          </section>

          <section class="address-section">
            <h2 class="address-section-title">Địa chỉ phụ</h2>
            ${
              secondaryAddresses.length
                ? `<div class="address-list">${secondaryAddresses
                    .map(function (address) {
                      return buildAddressCard(address, false);
                    })
                    .join("")}</div>`
                : '<p class="address-empty-text">Chưa có địa chỉ phụ.</p>'
            }
          </section>
        </div>
        ${buildAddressFormModal(formState, feedbackMarkup)}
        ${buildDeleteConfirmModal()}
      </div>
    `;
  }

  function render() {
    root.innerHTML = state.user ? buildAddressPageMarkup() : buildGuestMarkup();
  }

  async function reloadAddresses() {
    state.addresses = await fetchAddresses();

    if (
      state.editingAddressId &&
      !state.addresses.some(function (address) {
        return String(address.id) === String(state.editingAddressId);
      })
    ) {
      state.editingAddressId = null;
    }
  }

  function readPayload(form) {
    const formData = new FormData(form);

    return {
      label: String(formData.get("label") || "").trim(),
      recipient_name: String(formData.get("recipient_name") || "").trim(),
      phone_number: String(formData.get("phone_number") || "").trim(),
      state_or_province: String(formData.get("state_or_province") || "").trim(),
      district: String(formData.get("district") || "").trim(),
      ward: String(formData.get("ward") || "").trim(),
      address_line_1: String(formData.get("address_line_1") || "").trim(),
      address_line_2: String(formData.get("address_line_2") || "").trim(),
      delivery_notes: String(formData.get("delivery_notes") || "").trim(),
      is_default: formData.get("is_default") === "on"
    };
  }

  async function submitAddressForm(form) {
    const submitButton = form.querySelector("[data-address-submit]");
    const feedbackElement = form.querySelector(".profile-form-feedback");
    const originalLabel = submitButton.textContent;
    const payload = readPayload(form);
    const editingAddress = getEditingAddress();
    const endpoint = editingAddress
      ? `/api/users/me/addresses/${editingAddress.id}`
      : "/api/users/me/addresses";
    const method = editingAddress ? "PATCH" : "POST";

    submitButton.disabled = true;
    submitButton.textContent = "Đang lưu...";

    if (feedbackElement) {
      feedbackElement.textContent = "";
      feedbackElement.classList.remove("is-error", "is-success");
    }

    try {
      const response = await fetch(endpoint, {
        method,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responsePayload = await parseJson(response);

      if (!response.ok) {
        throw new Error(responsePayload?.message || "Không thể lưu địa chỉ.");
      }

      if (responsePayload?.address) {
        if (responsePayload.address.is_default) {
          applyDefaultAddress(responsePayload.address.id);
        }
        upsertAddress(responsePayload.address);
      } else {
        await reloadAddresses();
      }

      state.editingAddressId = null;
      state.isFormOpen = false;
      setFeedback(editingAddress ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ.", "success");
      render();
    } catch (error) {
      if (feedbackElement) {
        feedbackElement.textContent = error?.message || "Đã xảy ra lỗi khi lưu địa chỉ.";
        feedbackElement.classList.remove("is-success");
        feedbackElement.classList.add("is-error");
      }

      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  }

  async function setDefaultAddress(addressId) {
    const response = await fetch(`/api/users/me/addresses/${addressId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ is_default: true })
    });
    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Không thể đặt địa chỉ chính.");
    }

    return payload?.address || null;
  }

  async function deleteAddress(addressId) {
    const response = await fetch(`/api/users/me/addresses/${addressId}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    const payload = await parseJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Không thể xóa địa chỉ.");
    }
  }

  root.addEventListener("submit", function (event) {
    const form = event.target.closest("[data-address-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    submitAddressForm(form);
  });

  root.addEventListener("click", function (event) {
    const editButton = event.target.closest("[data-address-edit]");
    const defaultButton = event.target.closest("[data-address-default]");
    const deleteButton = event.target.closest("[data-address-delete]");
    const createButton = event.target.closest("[data-address-create]");
    const closeButton = event.target.closest("[data-address-close]");
    const deleteCancelButton = event.target.closest("[data-address-delete-cancel]");
    const deleteConfirmButton = event.target.closest("[data-address-delete-confirm]");

    if (editButton) {
      state.editingAddressId = editButton.getAttribute("data-address-edit");
      state.isFormOpen = true;
      state.confirmDeleteAddressId = null;
      setFeedback("", null);
      render();
      return;
    }

    if (defaultButton) {
      const addressId = defaultButton.getAttribute("data-address-default");

      setDefaultAddress(addressId)
        .then(function (updatedAddress) {
          state.editingAddressId = null;

          if (updatedAddress) {
            applyDefaultAddress(updatedAddress.id);
            upsertAddress(updatedAddress);
            return;
          }

          return reloadAddresses();
        })
        .then(function () {
          setFeedback("Đã đặt địa chỉ chính.", "success");
          render();
        })
        .catch(function (error) {
          setFeedback(error?.message || "Không thể đặt địa chỉ chính.", "error");
          render();
        });
      return;
    }

    if (deleteButton) {
      state.confirmDeleteAddressId = deleteButton.getAttribute("data-address-delete");
      state.deletingAddressId = null;
      render();
      return;
    }

    if (deleteCancelButton) {
      state.confirmDeleteAddressId = null;
      state.deletingAddressId = null;
      render();
      return;
    }

    if (deleteConfirmButton) {
      const addressId = state.confirmDeleteAddressId;

      if (!addressId || state.deletingAddressId) {
        return;
      }

      state.deletingAddressId = addressId;
      render();

      deleteAddress(addressId)
        .then(function () {
          const deletedAddress = state.addresses.find(function (address) {
            return String(address.id) === String(addressId);
          });

          removeAddressFromState(addressId);

          if (state.editingAddressId === addressId) {
            state.editingAddressId = null;
            state.isFormOpen = false;
          }

          if (deletedAddress?.is_default && state.addresses.length) {
            state.addresses[0] = Object.assign({}, state.addresses[0], { is_default: true });
          }

          state.confirmDeleteAddressId = null;
          state.deletingAddressId = null;
          setFeedback("Đã xóa địa chỉ.", "success");
          render();
        })
        .catch(function (error) {
          state.deletingAddressId = null;
          setFeedback(error?.message || "Không thể xóa địa chỉ.", "error");
          render();
        });
      return;
    }

    if (createButton) {
      state.editingAddressId = null;
      state.isFormOpen = true;
      state.confirmDeleteAddressId = null;
      setFeedback("", null);
      render();
      return;
    }

    if (closeButton) {
      state.editingAddressId = null;
      state.isFormOpen = false;
      setFeedback("", null);
      render();
    }
  });

  Promise.all([fetchCurrentUser(), fetchAddresses()])
    .then(function (results) {
      state.user = results[0];
      state.addresses = results[1];

      if (!state.user) {
        state.addresses = [];
      }

      render();
    })
    .catch(function (error) {
      root.innerHTML = `
        <div class="address-panel address-panel--empty">
          <h1 class="address-title">Địa chỉ</h1>
          <p class="address-copy">${escapeHtml(error?.message || "Đã xảy ra lỗi khi tải dữ liệu.")}</p>
        </div>
      `;
    });
})();
