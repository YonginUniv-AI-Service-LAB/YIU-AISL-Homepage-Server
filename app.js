const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  User,
  Notice,
  Post,
  Plan,
  Likes,
  sequelize,
  Project,
} = require("./models");
const isLoggedIn = require("./passport/isLoggedIn");
const isNotLoggedIn = require("./passport/isNotLoggedIn");
const LocalStrategy = require("passport-local").Strategy;
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const app = express();
dotenv.config();

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

const passportJWT = require("passport-jwt"),
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

const jwtOpts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
};

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "pwd",
    },
    async (email, pwd, done) => {
      try {
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (!bcrypt.compareSync(pwd, user.pwd)) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new JWTStrategy(jwtOpts, function (jwt_payload, done) {
    return User.findOne({ where: { email: jwt_payload.email } })
      .then((user) => {
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      })
      .catch((err) => {
        return done(err, false);
      });
  })
);

app.use("/api/public", express.static("public"));

const userRouter = require("./routes/user");
const noticeRouter = require("./routes/notice");
const communityRouter = require("./routes/community");
const projectRouter = require("./routes/project");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRouter);
app.use("/api/notice", noticeRouter);
app.use("/api/community", communityRouter);
app.use("/api/project", projectRouter);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile, { explorer: true })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get("/api/join", isNotLoggedIn, (req, res) => {
  res.sendStatus(200);
});

app.get("/api/login", isNotLoggedIn, (req, res) => {
  res.sendStatus(200);
});

app.get("/api/images/:img", (req, res) => {
  res.sendFile(__dirname + "/public/images/" + req.params.img);
});

app.get("/api/main", async (req, res) => {
  try {
    const plan = await Plan.findAll({
      attributes: ["planid", "contents", "date"],
      order: [["date", "DESC"]],
      limit: 5,
    });

    const post = await Post.findAll({
      attributes: ["postid", "writer", "contents", "createdAt"],
      include: [
        {
          model: User,
          // as: 'writerUser',
          attributes: ["name"],
        },
        {
          model: Likes,
          attributes: ["likeid", "liker", "createdAt"],
          include: [
            {
              model: User,
              // as: 'likeUser',
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const notice = await Notice.findAll({
      attributes: ["title", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });
    const project = await Project.findAll({
      attributes: ["projectid", "title", "img", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    const postResults = post.map((post) => ({
      postid: post.postid,
      writer: post.User.name, //writer
      contents: post.contents,
      createdAt: post.createdAt,
      likers: post.Likes.map((like) => ({
        likeid: like.likeid,
        postid: like.postid,
        liker: like.liker,
        createdAt: like.createdAt,
      })),
    }));

    res.status(200).json({ plan, post: postResults, notice, project });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/mypage", isLoggedIn, async (req, res) => {
  try {
    const email = req.user.email;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Post,
          // as: 'writerUser',
          attributes: ["contents"],
        },
      ],
      attributes: ["name", "email", "master"],
    });

    if (!user) {
      return res.sendStatus(404);
    }
    const posts = user.posts ? user.posts.map((post) => post.contents) : [];

    const response = {
      name: user.name,
      email: user.email,
      master: user.master,
      posts: posts,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/login", async (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      if (info || !user) {
        return res.sendStatus(401);
      }

      // 이메일이나 비밀번호가 누락된 경우
      if (!req.body.email || !req.body.pwd) {
        return res.sendStatus(400);
      }

      return req.login(user, { session: false }, async (loginErr) => {
        if (loginErr) {
          console.error(loginErr);
          return res.sendStatus(500);
        }
        const fullUserWithoutPwd = await User.findOne({
          where: { email: user.email },
          attributes: {
            exclude: ["pwd"],
          },
        });
        const accessToken = jwt.sign(
          {
            userid: user.userid,
            email: user.email,
            name: user.name,
            master: user.master,
          },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1h",
            issuer: "weather",
            subject: "user_info",
          }
        );
        const refreshToken = jwt.sign(
          {
            userid: user.userid,
            email: user.email,
            name: user.name,
            master: user.master,
          },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1d",
            issuer: "weather",
            subject: "user_info",
          }
        );
        fullUserWithoutPwd.token = refreshToken;
        await fullUserWithoutPwd.save();
        res.cookie("access_token", accessToken, {
          httpOnly: true,
        });
        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
          success: true,
          accessToken,
          user: {
            userid: user.userid,
            email: user.email,
            name: user.name,
            master: user.master,
          },
        });
        // res.send(req.user, accessToken).status(200)
      });
    }
  )(req, res, next);
});

app.post("/api/logout", async (req, res) => {
  try {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/join", async (req, res, next) => {
  const { name, email, pwd, question, answer } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(pwd, 10);

    const existingUser = await User.findOne({
      where: { email: email },
    });
    if (!name || !email || !pwd || !question || !answer) {
      // return res.sendStatus(400);
      return next({ status: 400, message: "Bad Request" });
    }
    if (existingUser) {
      return res.sendStatus(409);
    }
    await User.create({
      name: name,
      email: email,
      pwd: hashedPassword,
      question: question,
      answer: answer,
    });
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

app.post("/api/refresh-token", async (req, res) => {
  const refreshTokenFromClient = req.cookies["refresh_token"];

  if (!refreshTokenFromClient) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(
      refreshTokenFromClient,
      process.env.JWT_SECRET_KEY
    );

    const user = await User.findOne({
      where: { email: decoded.email },
      attributes: {
        exclude: ["pwd"],
      },
    });

    if (!user || user.token !== refreshTokenFromClient) {
      return res.sendStatus(401);
    }

    const newAccessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        name: user.name,
        master: user.master,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
        issuer: "weather",
        subject: "user_info",
      }
    );

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

app.listen(3002, async () => {
  console.log(`Listening on 3002`);
});

module.exports = app;
