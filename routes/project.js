const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const moment = require("moment-timezone");
const crypto = require("crypto");
const {
  User,
  Notice,
  Post,
  Plan,
  Likes,
  Project,
  sequelize,
} = require("../models");
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

const offset = 1000 * 60 * 60 * 9;

const upload = multer({
  storage: storage,
});

router.get("/", async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const results = projects.map((project) => ({
      projectid: project.projectid,
      title: project.title,
      contents: project.contents,
      link: project.link,
      writer: project.User ? project.User.name : "알 수 없음",
      img: project.img,
      createdAt: project.createdAt,
    }));

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
      const { title, contents, link } = req.body;
      const writer = req.user.userid;
      const today = new Date(new Date().getTime() + offset);
      const createdAt = dayjs(today).format("YYYY-MM-DD HH:mm:ss");
      let imageUrl = null;

      if (req.file) {
        imageUrl =
          "http://aiservicelab.yongin.ac.kr/api/public/images/" +
          req.file.filename;
      }

      const project = await Project.create({
        title,
        contents,
        link,
        writer,
        img: imageUrl,
        createdAt,
      });
      res.status(200).json(project);
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
      const { title, contents, link, projectid } = req.body;
      const project = await Project.findOne({
        where: { projectid: projectid },
      });

      if (!project) {
        return res.sendStatus(404);
      }

      if (req.file) {
        project.img =
          "http://aiservicelab.yongin.ac.kr/api/public/images/" +
          req.file.filename;
      } else if (!req.file) {
        project.img = null;
      }

      project.title = title;
      project.contents = contents;
      project.link = link;
      await project.save();

      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post("/delete", isLoggedIn, checkMasterPermission, async (req, res) => {
  try {
    const projectid = req.body.projectid;
    const result = await Project.destroy({ where: { projectid: projectid } });

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
    console.log("req.body: ", req.body);
    const projectid = req.body.projectid;
    console.log("projectId:", projectid);
    const project = await Project.findOne({ where: { projectid: projectid } });
    console.log("project 객체: ", project);
    if (!project) {
      return res.sendStatus(404);
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("오류 발생: ", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
