function requireAdmin(req, res, next) {
  if (String(req.currentUser?.role || "").toLowerCase() !== "admin") {
    res.status(403).json({
      message: "Bạn không có quyền truy cập khu vực quản trị."
    });
    return;
  }

  next();
}

module.exports = requireAdmin;
