const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const { User, Notice } = require("../models");
const isLoggedIn = require("../passport/isLoggedIn");
const dayjs = require("dayjs");
const checkMasterPermission = require("../middleware/checkMaster");
const cors = require("cors");

router.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const offset = 1000 * 60 * 60 * 9;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    let randomName = crypto.randomBytes(20).toString("hex");
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({
  storage: storage,
});

router.get("/", async (req, res) => {
  try {
    const notices = await Notice.findAll({
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const results = notices.map((notice) => {
      const writerName = notice.User ? notice.User.name : "알 수 없음";

      return {
        noticeid: notice.noticeid,
        title: notice.title,
        contents: notice.contents,
        writer: writerName,
        views: notice.views,
        img: notice.img,
        createdAt: notice.createdAt,
        // createdAt: dayjs(today).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/create",
  isLoggedIn,
  checkMasterPermission,
  upload.single("img"),
  async (req, res) => {
    try {
      const { title, contents } = req.body;
      const writer = req.user.userid;
      const today = new Date(new Date().getTime() + offset);
      const createdAt = dayjs(today).format("YYYY-MM-DD HH:mm:ss");
      let imageUrl = null;

      if (req.file) {
        console.log("req.file: ", req.file);
        imageUrl =
          "http://aiservicelab.yongin.ac.kr/api/public/images/" +
          req.file.filename;
        console.log("img url: ", imageUrl);
      }

      const notice = await Notice.create({
        title,
        contents,
        writer,
        img: imageUrl,
        createdAt,
      });
      res.status(200).json(notice);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/update",
  isLoggedIn,
  checkMasterPermission,
  upload.single("img"),
  async (req, res) => {
    try {
      const { title, contents, noticeid } = req.body;
      const notice = await Notice.findOne({ where: { noticeid: noticeid } });

      if (!notice) {
        return res.sendStatus(404);
      }

      if (req.file) {
        notice.img =
          "http://aiservicelab.yongin.ac.kr/api/public/images/" +
          req.file.filename;
      } else if (!req.file) {
        notice.img = null;
      }

      notice.title = title;
      notice.contents = contents;
      await notice.save();

      res.status(200).json(notice);
    } catch (err) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.post("/delete", isLoggedIn, checkMasterPermission, async (req, res) => {
  try {
    const { noticeid } = req.body;
    console.log(req.user);
    const result = await Notice.destroy({ where: { noticeid: noticeid } });

    if (result) {
      res.sendStatus(200);
    } else {
      res.sendStatus(403);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/detail", async (req, res) => {
  try {
    const noticeid = req.body.noticeid;
    const notice = await Notice.findOne({
      where: { noticeid: noticeid },
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
    });

    if (!notice) {
      return res.sendStatus(404);
    }

    notice.views += 1;
    await notice.save();

    const writerName = notice.User ? notice.User.name : "알수없음";
    const responseObject = {
      noticeid: notice.noticeid,
      title: notice.title,
      contents: notice.contents,
      writer: writerName,
      views: notice.views,
      img: notice.img,
      createdAt: notice.createdAt,
    };
    res.status(200).json(responseObject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
