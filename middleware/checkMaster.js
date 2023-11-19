const { User } = require("../models");

const checkMasterPermission = async (req, res, next) => {
  try {
    const userid = req.user ? req.user.userid : null;
    const user = await User.findOne({ where: { userid: userid } });
    if (!user) {
      return res.sendStatus(404);
    }
    if (user.master !== 2) {
      return res.sendStatus(403);
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = checkMasterPermission;
