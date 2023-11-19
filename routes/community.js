const dotenv = require("dotenv");
const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");
const { User, Post, Plan, Likes } = require("../models");
const isLoggedIn = require("../passport/isLoggedIn");
const dayjs = require("dayjs");
const checkGeneralPermission = require("../middleware/checkGeneral");
const cors = require("cors");
dotenv.config();

const offset = 1000 * 60 * 60 * 9;

router.use(
  cors({
    origin: true,
    credentials: true,
  })
);

router.get("/", async (req, res) => {
  // 좀 이상함
  try {
    const plans = await Plan.findAll({
      order: [["planid", "DESC"]],
    });

    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["name"],
        },
        {
          model: Likes,
        },
      ],
      order: [["postid", "DESC"]],
    });
    console.log("posts:", posts);

    const planResults = plans.map((plan) => ({
      planid: plan.planid,
      contents: plan.contents,
      date: moment(plan.date).format(),
    }));

    const postResults = posts.map((post) => ({
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

    res.status(200).json({ plan: planResults, post: postResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/likes", isLoggedIn, checkGeneralPermission, async (req, res) => {
  try {
    const postid = req.body.postid;
    const liker = req.user.userid;
    const today = new Date(new Date().getTime() + offset);
    const createdAt = dayjs(today).format("YYYY-MM-DD HH:mm:ss");
    const existingLike = await Likes.findOne({ where: { postid, liker } });

    if (existingLike) {
      await existingLike.destroy();
      res.sendStatus(204);
    } else {
      await Likes.create({ postid, liker, createdAt });
      res.sendStatus(201);
    }
  } catch (error) {
    res.sendStatus(500).json({ message: error.message });
  }
});

router.post(
  "/createpost",
  isLoggedIn,
  checkGeneralPermission,
  async (req, res) => {
    try {
      const { contents } = req.body;
      const writer = req.user.userid;
      const today = new Date(new Date().getTime() + offset);
      const createdAt = dayjs(today).format("YYYY-MM-DD HH:mm:ss");

      if (!contents) {
        return res.sendStatus(400);
      }

      await Post.create({ writer, contents, createdAt });
      res.sendStatus(201);
    } catch (error) {
      res.sendStatus(500).json({ message: error.message });
    }
  }
);

router.post(
  "/updatepost",
  isLoggedIn,
  checkGeneralPermission,
  async (req, res) => {
    try {
      const { postid, contents } = req.body;
      const writer = req.user.userid;

      if (!contents) {
        return res.sendStatus(400);
      }

      const post = await Post.findOne({ where: { postid, writer } });
      if (post) {
        post.contents = contents;
        await post.save();
        res.sendStatus(200);
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      res.sendStatus(500).json({ message: error.message });
    }
  }
);

router.post(
  "/deletepost",
  isLoggedIn,
  checkGeneralPermission,
  async (req, res) => {
    try {
      const { postid } = req.body;
      const writer = req.user.userid;

      const result = await Post.destroy({ where: { postid, writer } });
      if (result) {
        res.sendStatus(204);
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      res.sendStatus(500).json({ message: error.message });
    }
  }
);

router.post(
  "/createplan",
  isLoggedIn,
  checkGeneralPermission,
  async (req, res) => {
    try {
      let { date, contents } = req.body;
      const writer = req.user.userid;

      if (!date || !contents) {
        return res.sendStatus(400);
      }

      date = moment.utc(date).tz("Asia/Seoul").format("YYYY-MM-DD");

      await Plan.create({ writer, date, contents });
      res.sendStatus(201);
    } catch (error) {
      res.sendStatus(500).json({ message: error.message });
    }
  }
);

router.post(
  "/updateplan",
  isLoggedIn,
  checkGeneralPermission,
  async (req, res) => {
    try {
      const { planid, date, contents } = req.body;
      const writer = req.user.userid;

      if (!date || !contents) {
        return res.sendStatus(400);
      }

      const plan = await Plan.findOne({ where: { planid, writer } });
      if (plan) {
        plan.date = date;
        plan.contents = contents;
        await plan.save();
        res.sendStatus(200);
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/deleteplan",
  isLoggedIn,
  checkGeneralPermission,
  async (req, res) => {
    try {
      const { planid } = req.body;
      const writer = req.user.userid;

      const result = await Plan.destroy({ where: { planid, writer } });
      if (result) {
        res.sendStatus(204);
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      res.sendStatus(500).json({ message: error.message });
    }
  }
);

module.exports = router;
