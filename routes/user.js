var express = require('express');
const User = require('../models/user');
const axios = require('axios');
var router = express.Router();
const mqtt = require('mqtt');
require('dotenv').config();


let mqttClient = null;
let brokerIpAddress = null; // Global variable to store the broker IP

router.post('/receiveIp', async (req, res) => {
    const { ip } = req.body;
    brokerIpAddress = ip; // Save the received IP address
    //mqttClient = mqtt.connect(`mqtt://${brokerIpAddress}`);
    mqttClient = mqtt.connect('mqtt://localhost:1883');
    console.log('Received IP from Raspberry Pi:', ip);
    //--

    mqttClient.on('message', async (topic, message) => {
        const data = JSON.parse(message.toString());
        console.log(`Received data on topic ${topic}:`, data);
    
        if (topic === 'bloodSugar') {
            try {
                const {  value } = JSON.parse(message.toString());
                const clientID = process.env.CLIENT_ID;

                const user = await User.findOne({ clientID: clientID });
                if (!user)
                    return res.status(404).json({ status: 'fail', message: 'User not found' });
        
                // BloodSuger 배열에 새로운 데이터 추가
                user.bloodSuger.push({ date: new Date(), value });
        
                // 업데이트된 User 저장
                await user.save();
        
                return res.status(200).json({ status: 'success', message: 'Blood sugar data added successfully' });
            } catch (error) {
                console.error(error);
                return res.status(400).json(error);
            }
        } 
    });
    
    mqttClient.on('connect', async () => {
        console.log('Connected to MQTT broker');
    
        try {
            const accessToken = CLIENT_ACCESS_TOKEN;
            const clientID = process.env.CLIENT_ID;
            
            const user = await User.findOne({ clientID: clientID });
            const client = mqtt.connect(`mqtt://${brokerIpAddress}`);
    
            if (!user)
                return res.status(404).json({ status: 'fail', message: 'User not found' });
    
            // 현재 시간 계산
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const currentHour = today.getHours();
    
            // 현재 Step 정보 Fitbit에서 Fetch
            const apiEndPoint = `https://api.fitbit.com/1/user/-/activities/date/${formattedDate}.json`;
            const response = await axios.get(apiEndPoint, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
    
            let currentStep = 0;
            if (response.status === 200) {
                const data = response.data;
                currentStep = data['summary']['steps'];
                console.log(`[user]-[${today}]-[steps]`, data['summary']['steps']);
            } else {
                return res.status(400).json('Fitbit API Request Failed');
            }
    
            // 권장 걷기량 범위
            let timezone;
            let recommendedStep;
            if (currentHour >= 6 && currentHour < 12) {
                timezone = "AFTER_MORNING";
                recommendedStep = user.recommendStep[0].afterMorning;
            } else if (currentHour >= 12 && currentHour < 18) {
                timezone = "AFTER_LUNCH";
                recommendedStep = user.recommendStep[0].afterLunch;
            } else {
                timezone = "AFTER_DINNER";
                recommendedStep = user.recommendStep[0].afterDinner;
            }
    
            // 걷기량 비교 및 메시지 설정
            let needMoreStep = false;
            if (currentStep < recommendedStep)
                needMoreStep = true;
    
            // stepCount 배열에 새로운 걷기량 추가
            user.stepCount.push({ date: new Date(), value: currentStep });
            await user.save();
    
            // 걷기 데이터를 MQTT에 발행합니다
            const walkingData = {
                currentStep: currentStep,
                recommendedStep: recommendedStep
            };
            client.publish('walkingData', JSON.stringify(walkingData));
        } catch (error) {
            console.error(error);
            return res.status(400).json(error);
        }
    });

});

router.post('/addUser', async (req, res, next) => {
    // Destructure req.body
    const {
        name, clientID, phoneNumber, familyNumber,
        bloodSuger, stepCount, recommendStep,
    } = req.body;

    try {
        // Fitbit의 clientID 식별자로 하여 User 생성
        const exUser = await User.findOne({ clientID: clientID });
        if (exUser)
            return res.status(409).json({ status: "fail", message: "User Already Exists" });

        // Save newUser
        const newUser = new User({
            name, clientID, phoneNumber, familyNumber,
            bloodSuger, stepCount, recommendStep,
        });
        await newUser.save();

        return res.status(201).json({ status: "success", message: "AddUser Success" });
    } catch (error) {
        console.error(error);
        return res.status(400).json(error);
    }
});

router.put('/putBloodSuger', async (req, res, next) => {
    try {
        const { clientID, value } = req.body;

        const user = await User.findOne({ clientID: clientID });
        if (!user)
            return res.status(404).json({ status: 'fail', message: 'User not found' });

        // BloodSuger 배열에 새로운 데이터 추가
        user.bloodSuger.push({ date: new Date(), value });

        // 업데이트된 User 저장
        await user.save();

        return res.status(200).json({ status: 'success', message: 'Blood sugar data added successfully' });
    } catch (error) {
        console.error(error);
        return res.status(400).json(error);
    }
});

router.get('/getStepCount', async (req, res, next) => {
    try {
        const { accessToken, clientID } = req.body;

        const user = await User.findOne({ clientID: clientID });
        const client = mqtt.connect(`mqtt://${brokerIpAddress}`);
        if (!user)
            return res.status(404).json({ status: 'fail', message: 'User not found' });

        // 현재 시간 계산
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        const currentHour = today.getHours();

        // 현재 Step 정보 Fitbit에서 Fetch
        const apiEndPoint = `https://api.fitbit.com/1/user/-/activities/date/${formattedDate}.json`;
        const response = await axios.get(apiEndPoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        let currentStep = 0;
        if (response.status === 200) {
            const data = response.data;
            currentStep = data['summary']['steps'];
            console.log(`[user]-[${today}]-[steps]`, data['summary']['steps']);
        } else {
            return res.status(400).json('Fitbit API Request Failed');
        }

        // 권장 걷기량 범위
        let timezone;
        let recommendedStep;
        if (currentHour >= 6 && currentHour < 12) {
            timezone = "AFTER_MORNING";
            recommendedStep = user.recommendStep[0].afterMorning;
        } else if (currentHour >= 12 && currentHour < 18) {
            timezone = "AFTER_LUNCH";
            recommendedStep = user.recommendStep[0].afterLunch;
        } else {
            timezone = "AFTER_DINNER";
            recommendedStep = user.recommendStep[0].afterDinner;
        }

        // 걷기량 비교 및 메시지 설정
        let needMoreStep = false;
        if (currentStep < recommendedStep)
            needMoreStep = true;

        // stepCount 배열에 새로운 걷기량 추가
        user.stepCount.push({ date: new Date(), value: currentStep });
        await user.save();

        return res.status(200).json({
            status: 'success',
            time: today,
            timezone: timezone,
            recommendedStep: recommendedStep,
            currentStep: currentStep,
            needMoreStep: needMoreStep
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json(error);
    }
});

module.exports = router;