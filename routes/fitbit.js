var express = require('express');
const axios = require('axios');
var router = express.Router();

router.post('/fetchAccessToken', async (req, res) => {
	const apiEndPoint = 'https://api.fitbit.com/oauth2/token';
	const { clientID, clientSecret, refreshToken } = req.body;

	const base64ClientCredentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
	const authorizationHeader = `Basic ${base64ClientCredentials}`;

	try {
		const response = await axios.post(
			apiEndPoint,
			`grant_type=refresh_token&client_id=${clientID}&refresh_token=${refreshToken}`,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': authorizationHeader
				}
			}
		);

		if (response.status === 200) {
			return res.status(200).json(response.data);
		} else {
			return res.status(400).json('Fitbit API Request Failed');
		}
	} catch (error) {
		console.error('[Fitbit] ', error);
		return res.status(404).json(error);
	}
});

router.get('/fetchProfile', async (req, res) => {
	const apiEndPoint = 'https://api.fitbit.com/1/user/-/profile.json';
	accessToken = req.body.accessToken;
	try {
		const response = await axios.get(apiEndPoint, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		if (response.status === 200) {
			return res.status(200).json(response.data);
		} else {
			return res.status(400).json('Fitbit API Request Failed');
		}
	} catch (error) {
		console.error('[Fitbit] ', error);
		return res.status(404).json(error);
	}
});

// 하루의 Activity를 요약한 정보 전송
router.get('/fetchActivity', async (req, res) => {
	// Formatted Date로 오늘에 대한 요청 전송
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	const formattedDate = `${year}-${month}-${day}`;

	accessToken = req.body.accessToken;
	const apiEndPoint = `https://api.fitbit.com/1/user/-/activities/date/${formattedDate}.json`;
	try {
		const response = await axios.get(apiEndPoint, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		if (response.status === 200) {
			console.log(`[Fitbit]-[${today}]-[steps]`, response.data['summary']['steps']);
			return res.status(200).json(response.data);
		} else {
			return res.status(400).json('Fitbit API Request Failed');
		}
	} catch (error) {
		console.error('[Fitbit] ', error);
		return res.status(404).json(error);
	}
});

module.exports = router;