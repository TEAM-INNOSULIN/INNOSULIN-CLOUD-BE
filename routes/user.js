var express = require('express');
const User = require('../models/user');
var router = express.Router();

router.post('/addUser', async (req, res, next) => {
    // Destructure req.body
    const {
        name, accessToken, refreshToken, phoneNumber, familyNumber,
        bloodSuger, stepCount, recommendStep,
    } = req.body;

    try {
        // Fitbit의 refreshToken을 식별자로 하여 User 생성
        const exUser = await User.findOne({ refreshToken: refreshToken });
        if (exUser)
            return res.status(409).json({ status: "fail", message: "User Already Exists" });

        // Save newUser
        const newUser = new User({
            name, accessToken, refreshToken, phoneNumber, familyNumber,
            bloodSuger, stepCount, recommendStep,
        });
        await newUser.save();

        return res.status(201).json({ status: "success", message: "AddUser Success" });
    } catch (error) {
        console.error(error);
        return next(error);
    }

});

module.exports = router;