async function listUsers(_req, res) {
  res.json({
    items: [],
    message: "Skeleton endpoint. Replace with a real database query."
  });
}

function getCurrentUserProfile(req, res, next) {
  try {
    const user = req.currentUser;

    res.json({
      user: {
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
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentUserProfile,
  listUsers
};
