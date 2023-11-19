const {User} = require("../models");

const checkGeneralPermission = async (req, res, next) => {
    try {
        const userid = req.user.userid;
        const user = await User.findOne({where: {userid: userid}});
        if (!user) {
            return res.sendStatus(404);
        }
        if (user.master == 0) {
            return res.sendStatus(403);
        }
        next();
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports = checkGeneralPermission;