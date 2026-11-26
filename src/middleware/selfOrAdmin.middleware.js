// Mengatur siapa yang boleh mengubah data user:
// - admin: boleh mengubah siapa saja
// - petugas: hanya akunnya sendiri, dan tidak boleh mengubah role
export function selfOrAdminMiddleware(req, res, next) {
  const { id, role } = req.user;

  // Admin bebas
  if (role === "admin") {
    return next();
  }

  // Petugas hanya boleh mengubah akunnya sendiri
  if (Number(req.params.id) !== id) {
    return res.status(403).json({
      message: "Akses ditolak: hanya boleh mengubah akun sendiri",
    });
  }

  // Petugas tidak boleh mengganti role-nya (misalnya jadi admin)
  if (req.body.role !== undefined && req.body.role !== role) {
    return res.status(403).json({
      message: "Akses ditolak: petugas tidak boleh mengubah role",
    });
  }

  next();
}
