const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50,
        required: true,
    },
    email: {
        // 중복 허용x, 사용자 로그인시 사용
        type: String,
        trim: true,
        unique: 1,
        required: true,
    },
    password: {
        type: String,
        minlength: 5,
        required: true,
    },
    isOAuth: {
        type: Boolean,
        required: true,
    },
    OAuthType: {
        type: String,
        enum: ['kakao', 'google', 'naver'],
    },
    school: {
        type: String,
        required: true,
    },
    major: {
        type: String,
        required: true,
    },
    grade: {
        // 1학년, 2학년, 3학년, 4학년, 휴학생, 졸업생, 대학원생
        type: String,
        enum: ['freshman', 'sophomore', 'junior', 'senior', 'leaveAbsense', 'graduate', 'postgraduate'],
        required: true,
    },
    savedLectures: {
        Array: {
            type: String,
        },
    },
    usePurpose: {
        type: String,
        enum: ['offline', 'online', 'conversation', 'else'],
        required: true,
    },
});

module.exports = User = mongoose.model("User", userSchema)