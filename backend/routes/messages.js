const { addMessage, getMessages } = require("../controllers/messageController");
const express = require('express');
const router = express.Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);

module.exports = router;