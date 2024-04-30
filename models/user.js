const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    // 노인 사용자 이름
    name: {
        type: String,
        maxlength: 50,
        required: true,
    },
    // Fitbit ClientID
    clientID: {
        type: String,
        required: true,
    },
    // 노인 사용자 핸드폰 번호
    phoneNumber: {
        type: String,
        required: true,
    },
    // 노인 사용자 가족 연락처
    familyNumber: {
        Array: {
            type: String,
        },
    },
    // 혈당 정보
    bloodSuger: [
        {
            date: Date,
            value: Number,
        },
    ],
    // 걷기 기록 정보
    stepCount: [
        {
            date: Date,
            value: Number,
        },
    ],
    // 권장 걷기량
    recommendStep: [
        {
            afterMorning: Number,
            afterLunch: Number,
            afterDinner: Number,
        },
    ],
});

module.exports = User = mongoose.model("User", userSchema)