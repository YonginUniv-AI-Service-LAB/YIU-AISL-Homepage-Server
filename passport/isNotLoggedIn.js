const passport = require("passport");
const isNotLoggedIn = function (req, res, next) {
    passport.authenticate("jwt", {session: false}, (err, user) => {
        if (!user) {
            next();
        } else {
            req.user = user;
            res.redirect("/main")
        }
    })(req, res, next);
}

module.exports = isNotLoggedIn;