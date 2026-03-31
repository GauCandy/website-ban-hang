const { getPool } = require("../db/pool");

const ALLOWED_GENDERS = new Set(["male", "female"]);
const PROFILE_UPDATABLE_FIELDS = ["phone_number", "gender", "birth_date"];
const ADDRESS_UPDATABLE_FIELDS = [
  "label",
  "recipient_name",
  "phone_number",
  "state_or_province",
  "district",
  "ward",
  "address_line_1",
  "address_line_2",
  "delivery_notes",
  "is_default"
];
const PHONE_NUMBER_PATTERN = /^[0-9+().\-\s]{8,32}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USER_ADDRESS_SELECT = `
  select
    id,
    label,
    recipient_name,
    phone_number,
    country_code,
    state_or_province,
    district,
    ward,
    address_line_1,
    address_line_2,
    postal_code,
    delivery_notes,
    is_default,
    created_at,
    updated_at
  from user_addresses
`;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}

function hasOwnProperty(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function serializeUserProfile(user) {
  return {
    uid: user.id,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    gender: user.gender,
    birth_date: user.birth_date,
    avatar_url: user.avatar_url,
    role: user.role,
    account_status: user.account_status,
    marketing_opt_in: user.marketing_opt_in,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

function serializeUserAddress(address) {
  if (!address) {
    return null;
  }

  return {
    id: address.id,
    label: address.label,
    recipient_name: address.recipient_name,
    phone_number: address.phone_number,
    country_code: address.country_code,
    state_or_province: address.state_or_province,
    district: address.district,
    ward: address.ward,
    address_line_1: address.address_line_1,
    address_line_2: address.address_line_2,
    postal_code: address.postal_code,
    delivery_notes: address.delivery_notes,
    is_default: address.is_default,
    created_at: address.created_at,
    updated_at: address.updated_at
  };
}

function normalizeRequiredText(value, fieldLabel, maxLength) {
  if (typeof value !== "string") {
    throw createHttpError(400, `${fieldLabel} phai la chuoi ky tu.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw createHttpError(400, `${fieldLabel} khong duoc de trong.`);
  }

  if (normalizedValue.length > maxLength) {
    throw createHttpError(400, `${fieldLabel} vuot qua do dai cho phep.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value, fieldLabel, maxLength) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${fieldLabel} phai la chuoi ky tu.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw createHttpError(400, `${fieldLabel} vuot qua do dai cho phep.`);
  }

  return normalizedValue;
}

function normalizeRequiredPhoneNumber(value) {
  const normalizedValue = normalizePhoneNumber(value);

  if (!normalizedValue) {
    throw createHttpError(400, "So dien thoai khong duoc de trong.");
  }

  return normalizedValue;
}

function normalizePhoneNumber(value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, "So dien thoai phai la chuoi ky tu.");
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > 32 || !PHONE_NUMBER_PATTERN.test(normalizedValue)) {
    throw createHttpError(400, "So dien thoai khong hop le.");
  }

  return normalizedValue;
}

function normalizeGender(value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, "Gioi tinh phai la chuoi ky tu.");
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (!ALLOWED_GENDERS.has(normalizedValue)) {
    throw createHttpError(400, "Gioi tinh khong hop le.");
  }

  return normalizedValue;
}

function normalizeBirthDate(value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, "Ngay sinh phai theo dinh dang YYYY-MM-DD.");
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw createHttpError(400, "Ngay sinh phai theo dinh dang YYYY-MM-DD.");
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== normalizedValue
  ) {
    throw createHttpError(400, "Ngay sinh khong hop le.");
  }

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  if (parsedDate > todayUtc) {
    throw createHttpError(400, "Ngay sinh khong duoc lon hon ngay hien tai.");
  }

  return normalizedValue;
}

function normalizeBoolean(value, fieldLabel) {
  if (typeof value !== "boolean") {
    throw createHttpError(400, `${fieldLabel} phai la true hoac false.`);
  }

  return value;
}

function validateAddressId(addressId) {
  if (!UUID_PATTERN.test(String(addressId || "").trim())) {
    throw createHttpError(400, "Ma dia chi khong hop le.");
  }

  return String(addressId).trim();
}

function buildDefaultAddressLabel(sequenceNumber) {
  return `Dia chi ${sequenceNumber}`;
}

function buildAddressInput(requestBody, options = {}) {
  const existingAddress = options.existingAddress || null;
  const fallbackLabel = options.fallbackLabel || "Dia chi giao hang";
  const label = hasOwnProperty(requestBody, "label")
    ? normalizeOptionalText(requestBody.label, "Nhan dia chi", 100)
    : existingAddress?.label || null;
  const recipientName = hasOwnProperty(requestBody, "recipient_name")
    ? normalizeRequiredText(requestBody.recipient_name, "Ten nguoi nhan", 255)
    : existingAddress?.recipient_name || null;
  const phoneNumber = hasOwnProperty(requestBody, "phone_number")
    ? normalizeRequiredPhoneNumber(requestBody.phone_number)
    : existingAddress?.phone_number || null;
  const stateOrProvince = hasOwnProperty(requestBody, "state_or_province")
    ? normalizeRequiredText(requestBody.state_or_province, "Tinh thanh", 120)
    : existingAddress?.state_or_province || null;
  const district = hasOwnProperty(requestBody, "district")
    ? normalizeOptionalText(requestBody.district, "Quan huyen", 120)
    : existingAddress?.district || null;
  const ward = hasOwnProperty(requestBody, "ward")
    ? normalizeOptionalText(requestBody.ward, "Phuong xa", 120)
    : existingAddress?.ward || null;
  const addressLine1 = hasOwnProperty(requestBody, "address_line_1")
    ? normalizeRequiredText(requestBody.address_line_1, "Dia chi chi tiet", 255)
    : existingAddress?.address_line_1 || null;
  const addressLine2 = hasOwnProperty(requestBody, "address_line_2")
    ? normalizeOptionalText(requestBody.address_line_2, "Thong tin bo sung", 255)
    : existingAddress?.address_line_2 || null;
  const deliveryNotes = hasOwnProperty(requestBody, "delivery_notes")
    ? normalizeOptionalText(requestBody.delivery_notes, "Ghi chu giao hang", 1000)
    : existingAddress?.delivery_notes || null;
  const isDefault = hasOwnProperty(requestBody, "is_default")
    ? normalizeBoolean(requestBody.is_default, "Trang thai dia chi mac dinh")
    : Boolean(existingAddress?.is_default);

  if (!recipientName) {
    throw createHttpError(400, "Ten nguoi nhan khong duoc de trong.");
  }

  if (!phoneNumber) {
    throw createHttpError(400, "So dien thoai khong duoc de trong.");
  }

  if (!stateOrProvince) {
    throw createHttpError(400, "Tinh thanh khong duoc de trong.");
  }

  if (!addressLine1) {
    throw createHttpError(400, "Dia chi chi tiet khong duoc de trong.");
  }

  return {
    label: label || fallbackLabel,
    recipient_name: recipientName,
    phone_number: phoneNumber,
    country_code: "VN",
    state_or_province: stateOrProvince,
    district,
    ward,
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    postal_code: null,
    delivery_notes: deliveryNotes,
    is_default: isDefault
  };
}

async function listUsers(_req, res) {
  res.json({
    items: [],
    message: "Skeleton endpoint. Replace with a real database query."
  });
}

function getCurrentUserProfile(req, res, next) {
  getPool()
    .query(
      `
        select
          user_id,
          full_name,
          email,
          phone_number,
          gender,
          birth_date,
          avatar_url,
          role,
          account_status,
          marketing_opt_in,
          last_login_at,
          created_at,
          updated_at,
          auth_providers,
          has_identity
        from v_user_profiles
        where user_id = $1
        limit 1
      `,
      [req.currentUser.id]
    )
    .then((result) => {
      if (!result.rowCount) {
        res.status(404).json({
          message: "Khong tim thay nguoi dung."
        });
        return;
      }

      const user = result.rows[0];

      res.json({
        user: {
          uid: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birth_date: user.birth_date,
          avatar_url: user.avatar_url,
          role: user.role,
          account_status: user.account_status,
          marketing_opt_in: user.marketing_opt_in,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          auth_providers: user.auth_providers,
          has_identity: user.has_identity
        }
      });
    })
    .catch(next);
}

async function queryUserAddresses(client, userId) {
  const result = await client.query(
    `
      ${USER_ADDRESS_SELECT}
      where user_id = $1
      order by is_default desc, updated_at desc, created_at asc
    `,
    [userId]
  );

  return result.rows;
}

async function queryUserAddressById(client, userId, addressId, options = {}) {
  const lockClause = options.forUpdate ? "for update" : "";
  const result = await client.query(
    `
      ${USER_ADDRESS_SELECT}
      where user_id = $1 and id = $2
      ${lockClause}
      limit 1
    `,
    [userId, addressId]
  );

  return result.rows[0] || null;
}

async function queryDefaultUserAddress(client, userId, options = {}) {
  const lockClause = options.forUpdate ? "for update" : "";
  const result = await client.query(
    `
      ${USER_ADDRESS_SELECT}
      where user_id = $1
      order by is_default desc, updated_at desc, created_at asc
      ${lockClause}
      limit 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function clearUserDefaultAddress(client, userId, excludeAddressId = null) {
  if (excludeAddressId) {
    await client.query(
      `
        update user_addresses
        set is_default = false, updated_at = now()
        where user_id = $1 and id <> $2 and is_default = true
      `,
      [userId, excludeAddressId]
    );
    return;
  }

  await client.query(
    `
      update user_addresses
      set is_default = false, updated_at = now()
      where user_id = $1 and is_default = true
    `,
    [userId]
  );
}

async function promoteFallbackAddress(client, userId, excludeAddressId = null) {
  const result = await client.query(
    `
      select id
      from user_addresses
      where user_id = $1
        and ($2::uuid is null or id <> $2)
      order by updated_at desc, created_at asc
      limit 1
    `,
    [userId, excludeAddressId]
  );

  if (!result.rowCount) {
    return null;
  }

  await client.query(
    `
      update user_addresses
      set is_default = true, updated_at = now()
      where id = $1
    `,
    [result.rows[0].id]
  );

  return result.rows[0].id;
}

async function getCurrentUserAddress(req, res, next) {
  const client = await getPool().connect();

  try {
    const address = await queryDefaultUserAddress(client, req.currentUser.id);

    res.json({
      address: serializeUserAddress(address)
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
}

async function getCurrentUserAddresses(req, res, next) {
  const client = await getPool().connect();

  try {
    const addresses = await queryUserAddresses(client, req.currentUser.id);

    res.json({
      items: addresses.map(serializeUserAddress)
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
}

async function updateCurrentUserProfile(req, res, next) {
  try {
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : null;

    if (!requestBody) {
      res.status(400).json({
        message: "Body request khong hop le."
      });
      return;
    }

    const hasUpdatableField = PROFILE_UPDATABLE_FIELDS.some((fieldName) =>
      hasOwnProperty(requestBody, fieldName)
    );

    if (!hasUpdatableField) {
      res.status(400).json({
        message: "Khong co truong nao de cap nhat."
      });
      return;
    }

    const nextPhoneNumber = hasOwnProperty(requestBody, "phone_number")
      ? normalizePhoneNumber(requestBody.phone_number)
      : req.currentUser.phone_number;
    const nextGender = hasOwnProperty(requestBody, "gender")
      ? normalizeGender(requestBody.gender)
      : req.currentUser.gender;
    const nextBirthDate = hasOwnProperty(requestBody, "birth_date")
      ? normalizeBirthDate(requestBody.birth_date)
      : req.currentUser.birth_date;
    const result = await getPool().query(
      `
        update users
        set
          phone_number = $1,
          gender = $2,
          birth_date = $3,
          updated_at = now()
        where id = $4
        returning
          id,
          full_name,
          email,
          phone_number,
          gender,
          birth_date,
          avatar_url,
          role,
          account_status,
          marketing_opt_in,
          last_login_at,
          created_at,
          updated_at
      `,
      [nextPhoneNumber, nextGender, nextBirthDate, req.currentUser.id]
    );

    if (!result.rowCount) {
      res.status(404).json({
        message: "Khong tim thay nguoi dung."
      });
      return;
    }

    req.currentUser = result.rows[0];
    res.json({
      message: "Cap nhat thong tin thanh cong.",
      user: serializeUserProfile(result.rows[0])
    });
  } catch (error) {
    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({
        message: error.message
      });
      return;
    }

    next(error);
  }
}

async function createCurrentUserAddress(req, res, next) {
  const client = await getPool().connect();

  try {
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : null;

    if (!requestBody) {
      res.status(400).json({
        message: "Body request khong hop le."
      });
      return;
    }

    const hasUpdatableField = ADDRESS_UPDATABLE_FIELDS.some((fieldName) =>
      hasOwnProperty(requestBody, fieldName)
    );

    if (!hasUpdatableField) {
      res.status(400).json({
        message: "Khong co truong dia chi nao de tao."
      });
      return;
    }

    await client.query("begin");
    const existingAddresses = await queryUserAddresses(client, req.currentUser.id);
    const normalizedAddress = buildAddressInput(requestBody, {
      fallbackLabel: buildDefaultAddressLabel(existingAddresses.length + 1)
    });
    const shouldBeDefault = existingAddresses.length === 0 || normalizedAddress.is_default;

    if (shouldBeDefault) {
      await clearUserDefaultAddress(client, req.currentUser.id);
    }

    const result = await client.query(
      `
        insert into user_addresses (
          user_id,
          label,
          recipient_name,
          phone_number,
          country_code,
          state_or_province,
          district,
          ward,
          address_line_1,
          address_line_2,
          postal_code,
          delivery_notes,
          is_default
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        returning
          id,
          label,
          recipient_name,
          phone_number,
          country_code,
          state_or_province,
          district,
          ward,
          address_line_1,
          address_line_2,
          postal_code,
          delivery_notes,
          is_default,
          created_at,
          updated_at
      `,
      [
        req.currentUser.id,
        normalizedAddress.label,
        normalizedAddress.recipient_name,
        normalizedAddress.phone_number,
        normalizedAddress.country_code,
        normalizedAddress.state_or_province,
        normalizedAddress.district,
        normalizedAddress.ward,
        normalizedAddress.address_line_1,
        normalizedAddress.address_line_2,
        normalizedAddress.postal_code,
        normalizedAddress.delivery_notes,
        shouldBeDefault
      ]
    );

    await client.query("commit");

    res.status(201).json({
      message: "Da them dia chi thanh cong.",
      address: serializeUserAddress(result.rows[0])
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({
        message: error.message
      });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function updateCurrentUserAddress(req, res, next) {
  const client = await getPool().connect();

  try {
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : null;

    if (!requestBody) {
      res.status(400).json({
        message: "Body request khong hop le."
      });
      return;
    }

    const hasUpdatableField = ADDRESS_UPDATABLE_FIELDS.some((fieldName) =>
      hasOwnProperty(requestBody, fieldName)
    );

    if (!hasUpdatableField) {
      res.status(400).json({
        message: "Khong co truong dia chi nao de cap nhat."
      });
      return;
    }

    const addressId = validateAddressId(req.params.addressId);

    await client.query("begin");
    const existingAddress = await queryUserAddressById(client, req.currentUser.id, addressId, {
      forUpdate: true
    });

    if (!existingAddress) {
      throw createHttpError(404, "Khong tim thay dia chi.");
    }

    const normalizedAddress = buildAddressInput(requestBody, {
      existingAddress,
      fallbackLabel: existingAddress.label || "Dia chi giao hang"
    });

    let shouldRemainDefault = normalizedAddress.is_default;

    if (shouldRemainDefault) {
      await clearUserDefaultAddress(client, req.currentUser.id, addressId);
    } else if (existingAddress.is_default) {
      const promotedId = await promoteFallbackAddress(client, req.currentUser.id, addressId);

      if (!promotedId) {
        shouldRemainDefault = true;
      }
    }

    const result = await client.query(
      `
        update user_addresses
        set
          label = $1,
          recipient_name = $2,
          phone_number = $3,
          country_code = $4,
          state_or_province = $5,
          district = $6,
          ward = $7,
          address_line_1 = $8,
          address_line_2 = $9,
          postal_code = $10,
          delivery_notes = $11,
          is_default = $12,
          updated_at = now()
        where id = $13 and user_id = $14
        returning
          id,
          label,
          recipient_name,
          phone_number,
          country_code,
          state_or_province,
          district,
          ward,
          address_line_1,
          address_line_2,
          postal_code,
          delivery_notes,
          is_default,
          created_at,
          updated_at
      `,
      [
        normalizedAddress.label,
        normalizedAddress.recipient_name,
        normalizedAddress.phone_number,
        normalizedAddress.country_code,
        normalizedAddress.state_or_province,
        normalizedAddress.district,
        normalizedAddress.ward,
        normalizedAddress.address_line_1,
        normalizedAddress.address_line_2,
        normalizedAddress.postal_code,
        normalizedAddress.delivery_notes,
        shouldRemainDefault,
        addressId,
        req.currentUser.id
      ]
    );

    await client.query("commit");

    res.json({
      message: "Cap nhat dia chi thanh cong.",
      address: serializeUserAddress(result.rows[0])
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({
        message: error.message
      });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function deleteCurrentUserAddress(req, res, next) {
  const client = await getPool().connect();

  try {
    const addressId = validateAddressId(req.params.addressId);

    await client.query("begin");
    const existingAddress = await queryUserAddressById(client, req.currentUser.id, addressId, {
      forUpdate: true
    });

    if (!existingAddress) {
      throw createHttpError(404, "Khong tim thay dia chi.");
    }

    await client.query(
      `
        delete from user_addresses
        where id = $1 and user_id = $2
      `,
      [addressId, req.currentUser.id]
    );

    if (existingAddress.is_default) {
      await promoteFallbackAddress(client, req.currentUser.id);
    }

    await client.query("commit");

    res.json({
      message: "Da xoa dia chi thanh cong."
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({
        message: error.message
      });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

async function upsertCurrentUserAddress(req, res, next) {
  const client = await getPool().connect();

  try {
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : null;

    if (!requestBody) {
      res.status(400).json({
        message: "Body request khong hop le."
      });
      return;
    }

    await client.query("begin");
    const defaultAddress = await queryDefaultUserAddress(client, req.currentUser.id, {
      forUpdate: true
    });

    let result;

    if (!defaultAddress) {
      const normalizedAddress = buildAddressInput(requestBody, {
        fallbackLabel: "Dia chi giao hang"
      });

      result = await client.query(
        `
          insert into user_addresses (
            user_id,
            label,
            recipient_name,
            phone_number,
            country_code,
            state_or_province,
            district,
            ward,
            address_line_1,
            address_line_2,
            postal_code,
            delivery_notes,
            is_default
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
          returning
            id,
            label,
            recipient_name,
            phone_number,
            country_code,
            state_or_province,
            district,
            ward,
            address_line_1,
            address_line_2,
            postal_code,
            delivery_notes,
            is_default,
            created_at,
            updated_at
        `,
        [
          req.currentUser.id,
          normalizedAddress.label,
          normalizedAddress.recipient_name,
          normalizedAddress.phone_number,
          normalizedAddress.country_code,
          normalizedAddress.state_or_province,
          normalizedAddress.district,
          normalizedAddress.ward,
          normalizedAddress.address_line_1,
          normalizedAddress.address_line_2,
          normalizedAddress.postal_code,
          normalizedAddress.delivery_notes
        ]
      );
    } else {
      const normalizedAddress = buildAddressInput(requestBody, {
        existingAddress: {
          ...defaultAddress,
          is_default: true
        },
        fallbackLabel: defaultAddress.label || "Dia chi giao hang"
      });

      result = await client.query(
        `
          update user_addresses
          set
            label = $1,
            recipient_name = $2,
            phone_number = $3,
            country_code = $4,
            state_or_province = $5,
            district = $6,
            ward = $7,
            address_line_1 = $8,
            address_line_2 = $9,
            postal_code = $10,
            delivery_notes = $11,
            is_default = true,
            updated_at = now()
          where id = $12 and user_id = $13
          returning
            id,
            label,
            recipient_name,
            phone_number,
            country_code,
            state_or_province,
            district,
            ward,
            address_line_1,
            address_line_2,
            postal_code,
            delivery_notes,
            is_default,
            created_at,
            updated_at
        `,
        [
          normalizedAddress.label,
          normalizedAddress.recipient_name,
          normalizedAddress.phone_number,
          normalizedAddress.country_code,
          normalizedAddress.state_or_province,
          normalizedAddress.district,
          normalizedAddress.ward,
          normalizedAddress.address_line_1,
          normalizedAddress.address_line_2,
          normalizedAddress.postal_code,
          normalizedAddress.delivery_notes,
          defaultAddress.id,
          req.currentUser.id
        ]
      );
    }

    await client.query("commit");

    res.json({
      message: "Cap nhat dia chi giao hang thanh cong.",
      address: serializeUserAddress(result.rows[0])
    });
  } catch (error) {
    await client.query("rollback").catch(() => {});

    if (error?.expose && error?.statusCode) {
      res.status(error.statusCode).json({
        message: error.message
      });
      return;
    }

    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  createCurrentUserAddress,
  deleteCurrentUserAddress,
  getCurrentUserAddress,
  getCurrentUserAddresses,
  getCurrentUserProfile,
  listUsers,
  updateCurrentUserAddress,
  updateCurrentUserProfile,
  upsertCurrentUserAddress
};
