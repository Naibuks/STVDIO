const express = require("express");
const { getFeed, getCreatives } = require("../controllers/feed.controller");
const { optionalAuthenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Public. optionalAuthenticate only adds `likedByMe` for a signed-in viewer —
// it never widens what the feed returns.
router.get("/", optionalAuthenticate, getFeed);
router.get("/creatives", optionalAuthenticate, getCreatives);

module.exports = router;
