export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    // Cek user dulu, baru baca role-nya
    if (!req.user) {
      return res.status(401).json({
        message: "User belum terautentikasi",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    next();
  };
}
