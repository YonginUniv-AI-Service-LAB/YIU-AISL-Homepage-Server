const passport = require("passport");
const {Strategy: LocalStrategy} = require("passport-local");
const {User} = require("../models");
const bcrypt = require("bcrypt");

passport.use(
    new LocalStrategy({
            usernameField: 'email',
            passwordField: 'pwd',
        },
        async (email, pwd, done) => {
            try {
                const user = await User.findOne({where: {email},});
                if (!user) {
                    return done(null, false, {
                        reason: "사용자가 존재하지 않습니다."
                    });
                }
                const result = await bcrypt.compare(pwd, user.pwd);
                if (result) {
                    return done(null, user);
                }
                return done(null, false, {reason: "비밀번호가 틀렸습니다."});
            } catch (error) {
                console.error(error);
                return done(error);
            }
        })
)