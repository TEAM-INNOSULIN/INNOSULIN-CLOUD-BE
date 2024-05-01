const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('./models/user');
const aws = require('aws-sdk');
let s3 = new aws.S3();
const fs = require('fs');
const csv = require('csv-parser');

function createCronJob(){
    // AWS Credential
    aws.config.update({ 
        region: "ap-northeast-2",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    s3 = new aws.S3({ apiVersion: "2006-03-01" });
    console.log("[S3-CRON] Created S3 Object");

    s3.listBuckets(function (err, data) {
        if (err) {
          console.log("Error", err);
          return;
        } else {
          console.log("[S3-CRON] List S3 Bucket ");
          console.log(data.Buckets);
        }
    });

    // Cron 작업 설정 (매 시간 0분 실행)
    // 모든 User에 대해 S3에 데이터 생성
    cron.schedule('0 * * * *', async () => {
        const users = await User.find({});
    
        for (const user of users) {
            const clientID = user.clientID;
            const folderPath = `${__dirname}/uploads/${clientID}`;
        
            // Local 환경 데이터 폴더 생성
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
        
            // CSV 파일 생성
            const stepCountCsvPath = `${folderPath}/stepCount_${clientID}.csv`;
            const bloodSugarCsvPath = `${folderPath}/bloodSugar_${clientID}.csv`;
        
            // 기존 CSV 파일이 존재한다면 삭제
            if (fs.existsSync(stepCountCsvPath)) {
                fs.unlinkSync(stepCountCsvPath);
            }
            if (fs.existsSync(bloodSugarCsvPath)) {
                fs.unlinkSync(bloodSugarCsvPath);
            }
        
            // User의 데이터를 CSV 파일로 저장
            const stepCountCsv = user.stepCount.map(data => `${data.date},${data.value}`).join('\n');
            fs.writeFileSync(stepCountCsvPath, stepCountCsv);
        
            const bloodSugarCsv = user.bloodSuger.map(data => `${data.date},${data.value}`).join('\n');
            fs.writeFileSync(bloodSugarCsvPath, bloodSugarCsv);
        
            console.log(`[S3-CRON]-[${clientID}] Created BloodSugar, StepCount CSV Files`);
            // AWS S3에 파일 업로드
            const stepCountFile = fs.readFileSync(stepCountCsvPath);
            const bloodSugarFile = fs.readFileSync(bloodSugarCsvPath);
        
            const stepCountParams = {
                Bucket: 'innosulin-bucket',
                Key: `${clientID}/stepCount.csv`,
                Body: stepCountFile
            };
            
            const bloodSugarParams = {
                Bucket: 'innosulin-bucket',
                Key: `${clientID}/bloodSugar.csv`,
                Body: bloodSugarFile
            };
        
            s3.upload(stepCountParams, (err, data) => {
                if (err) {
                    console.error('Error uploading stepCount file:', err);
                } else {
                    console.log(`[S3-CRON]-[${clientID}] StepCount file uploaded successfully`);
                    console.log(data.Location)
                }
            });
           
            s3.upload(bloodSugarParams, (err, data) => {
                if (err) {
                    console.error('Error uploading bloodSugar file:', err);
                } else {
                    console.log(`[S3-CRON]-[${clientID}] BloodSugar file uploaded successfully`);
                    console.log(data.Location)
                }
            });
        }
    });
}

module.exports = createCronJob;
