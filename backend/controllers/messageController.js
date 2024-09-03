const Messages = require("../models/messageModel");


module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await Messages.find({
      users: { $all: [from, to] }
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => ({
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text,
    }));

    // Send the array directly
    return res.json(projectedMessages);

  } catch (ex) {
    next(ex);
  }
};



  module.exports.addMessage = async (req, res, next) => {
    try {
      const {from, to, message} = req.body;
      const data = await Messages.create({
        message:{text:message},
        users: [from, to],
        sender: from,
      })

      if(data) return res.json({info:'Message added successfully.'})

        else{
             return res.status(209).json({ warn: "Failed to add message to the database" });
        }
    } catch (ex) {
      next(ex);
    }
  };
  