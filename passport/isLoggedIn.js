const passport = require("passport");
const isLoggedIn = function (req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(403).send("로그인 필요");
    }
  })(req, res, next);
};

module.exports = isLoggedIn;
