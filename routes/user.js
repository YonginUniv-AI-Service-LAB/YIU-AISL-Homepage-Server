const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, Notice, Post, Plan, Likes, sequelize } = require("../models");
const isLoggedIn = require("../passport/isLoggedIn");
const checkMasterPermission = require("../middleware/checkMaster");
const cors = require("cors");
const isNotLoggedIn = require("../passport/isNotLoggedIn");
router.use(
  cors({
    origin: true,
    credentials: true,
  })
);
router.use(express.json());

router.get("/", isLoggedIn, checkMasterPermission, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["userid", "name", "email", "master"],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/wait", isLoggedIn, checkMasterPermission, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { master: 0 },
      attributes: ["userid", "name", "email"],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/master", isLoggedIn, checkMasterPermission, async (req, res) => {
  const { userid } = req.body;
  try {
    await User.update({ master: 2 }, { where: { userid } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/enter", isLoggedIn, checkMasterPermission, async (req, res) => {
  const { userid } = req.body;
  try {
    await User.update({ master: 1 }, { where: { userid } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/refuse", isLoggedIn, checkMasterPermission, async (req, res) => {
  const { userid } = req.body;
  try {
    await User.update({ master: 0 }, { where: { userid } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/findemail", async (req, res) => {
  const { name, question, answer } = req.body;
  try {
    const user = await User.findOne({
      where: { name, question, answer },
      attributes: ["email"],
    });
    if (!user) return res.sendStatus(401);
    res.status(200).json({ email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/findpwd", async (req, res) => {
  const { name, email, question, answer } = req.body;
  try {
    const user = await User.findOne({
      where: { name, email, question, answer },
    });
    if (!user) return res.sendStatus(401);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/changepwd", async (req, res) => {
  const { email, newPwd } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const hashedPwd = await bcrypt.hash(newPwd, 10);
    await User.update({ pwd: hashedPwd }, { where: { email } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
