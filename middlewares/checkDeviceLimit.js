const Admin = require("../models/Admin");
const DeviceSession = require("../models/DeviceSession"); 

module.exports = async (req, res, next) => {
  const adminId = req.adminId;
  const admin = await Admin.findByPk(adminId);

  if (!admin) return res.status(403).json({ message: "Access denied" });

  const activeSessions = await DeviceSession.count({ where: { adminId } });

  if (activeSessions >= admin.allowedDevices) {
    return res.status(403).json({ message: "Max device limit reached" });
  }

  next();
};
