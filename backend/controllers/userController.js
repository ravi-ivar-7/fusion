const User = require("../models/userModel");
const bcrypt = require("bcrypt");

module.exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user)
            return res.status(209).json({ warn: "User not found",});
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(209).json({ warn: "Incorrect Password.",});
        delete user.password;
        return res.status(200).json({user, info: 'Successfully looged in.' });
    } catch (err) {
        next(err);
        console.log(err)
    }
};

module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const usernameCheck = await User.findOne({ username });
        if (usernameCheck)
            return res.status(209).json({ info: "Username already used", });
        const emailCheck = await User.findOne({ email });
        if (emailCheck)
            return res.status(209).json({ info: "Email already used", });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            username,
            password: hashedPassword,
        });
        delete user.password;
        return res.status(200).json({ user, info: 'Account created successfully.' });
    } catch (ex) {
        next(ex);
    }
};

module.exports.getAllUsers = async (req, res, next) => {
    try {
        // Fetch users excluding the one with the given id
        const users = await User.find({ _id: { $ne: req.params.id } })
            .select(["email", "username", "avatarImage", "_id"])
            .exec(); // Use exec() to execute the query

        return res.json(users);
    } catch (error) {
        // Handle any errors that occur
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching users' });
    }
}

module.exports.setAvatar = async (req, res, next) => {  
    try {
        const userId = req.params.id;
        const avatarImage = req.body.image;
        const userData = await User.findByIdAndUpdate(userId, { isAvatarImageSet: true, avatarImage }, { new: true });

        return res.json({ isSet: userData.isAvatarImageSet, image: userData.avatarImage, info: 'Avatar set successfully.' });  
    } catch (err) {
        next(err);  
    }
}


module.exports.logOut = (req, res, next) => {
    try {
        if (!req.params.id) return res.status(209).json({ warn: "User id is required " });
        onlineUsers.delete(req.params.id)
        return res.json({info: 'Logged out successfully'})
    } catch (ex) {
      next(ex);
    }
  };