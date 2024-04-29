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

router.put('/putBloodSuger', async (req, res, next) => {
    try {
        const { refreshToken, value } = req.body;

        const user = await User.findOne({ refreshToken: refreshToken });
        if (!user)
            return res.status(404).json({ status: 'fail', message: 'User not found' });

        // BloodSuger 배열에 새로운 데이터 추가
        user.bloodSuger.push({ date: new Date(), value });

        // 업데이트된 User 저장
        await user.save();

        return res.status(200).json({ status: 'success', message: 'Blood sugar data added successfully' });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;