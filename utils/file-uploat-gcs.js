"use strict";
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const dayjs = require("dayjs");
const Multer = require('multer');
const {unflat} = require("./Utils");
const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 15 * 1024 * 1024 // no larger than 15mb
    }
});

//https://github.com/expressjs/multer/blob/master/StorageEngine.md
function getPublicUrl (bucketName,filename) {
    return `https://storage.googleapis.com/${bucketName}/${filename}`;
}
function sendUploadToGCS(bucketName) {
    const bucket = storage.bucket(bucketName);

    return async (req, res, next) => {
        if (!req.files) {
            return next();
        }
        unflat(req.body);
        const today = dayjs().format("YYYY/MM/DD");
        const prefix = today+"/"+Date.now()+"_";
        let promiseArr = [];
        for (let i = 0; i < req.files.length; i++) {
            const gcsName = prefix + req.files[i].originalname;
            const file = bucket.file(gcsName);

            promiseArr.push( file.save(req.files[i].buffer, {
                metadata: {
                    contentType: req.files[i].mimetype
                },
                public: true,
                resumable: false
            }));
            req.files[i].cloudStorageObject = gcsName;
            req.files[i].cloudStoragePublicUrl = getPublicUrl(bucketName,gcsName);
            let fieldName = req.files[i].fieldname;
            let publicUrl = req.files[i].cloudStoragePublicUrl;
            let fileObj = {
                label: req.files[i].originalname,
                size:req.files[i].size,
                type: req.files[i].mimetype,
                url:publicUrl
            };

            let body = req.body;

            if (fieldName.match(/^([^.]+)\.([0-9]+)\.([^.]+)$/)) {
                let [n, idx, prop] = fieldName.split(".");
                if (!(body[n] instanceof Array)) {
                    body[n] = [];
                }
                if (!body[n][idx]) {
                    body[n][idx] = {};
                }
                body = body[n][idx];
                fieldName = prop;

            }
            if (body[fieldName] === undefined) {

                body[fieldName] = [fileObj];
                body[fieldName + "_urls"] = [publicUrl];

            } else if (body[fieldName] instanceof Array) {
                body[fieldName + "_urls"] = [];
                for (let j = 0; j < body[fieldName].length; j++) {
                    if (typeof body[fieldName][j] === "string") {
                        body[fieldName][j] = JSON.parse(body[fieldName][j]);
                    }
                    body[fieldName + "_urls"].push(body[fieldName][j].url);
                }

                body[fieldName].push(fileObj);
                body[fieldName + "_urls"].push(publicUrl);
            } else {

                body[fieldName] = [body[fieldName], fileObj];
                body[fieldName + "_urls"] = [body[fieldName + "_urls"], publicUrl];
            }
        }
        await Promise.all(promiseArr);
        return next();
    }
}
module.exports = {
    getPublicUrl,
    sendUploadToGCS,
    multer
};
