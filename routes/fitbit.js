var express = require('express');
const fetch = require('node-fetch');
var router = express.Router();

router.get('/fetchProfile', async (req, res) => {
	const apiEndPoint = 'https://api.fitbit.com/1/user/-/profile.json';
	accessToken = req.body.accessToken;
	try {
		const response = await fetch(apiEndPoint, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			// console.log("[Fitbit] ", data);
			return res.status(200).json(data);
		} else {
			return res.status(400).json('Fitbit API Request Failed');
		}
	} catch (error) {
		console.error('[Fitbit] ', error);
		next(error);
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
		const response = await fetch(apiEndPoint, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			console.log(`[Fitbit]-[${today}]-[steps]`, data['summary']['steps']);
			return res.status(200).json(data);
		} else {
			return res.status(400).json('Fitbit API Request Failed');
		}
	} catch (error) {
		console.error('[Fitbit] ', error);
		next(error);
	}
});

module.exports = router;
