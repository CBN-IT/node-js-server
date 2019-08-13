"use strict";
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const moment = require("moment");
const Multer = require('multer');
const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 15 * 1024 * 1024 // no larger than 5mb
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
        console.log("merge?");
        const today = moment().format("YYYY/MM/DD");
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
            if (req.body[fieldName] === undefined) {

                req.body[fieldName] = [fileObj];
                req.body[fieldName+"_urls"] = [publicUrl];

            } else if (req.body[fieldName] instanceof Array) {
                req.body[fieldName + "_urls"] = [];
                for (let j = 0; j < req.body[fieldName].length; j++) {
                    if (typeof req.body[fieldName][j] === "string") {
                        req.body[fieldName][j] = JSON.parse(req.body[fieldName][j]);
                    }
                    req.body[fieldName + "_urls"].push(req.body[fieldName][j].url);
                }
                req.body[fieldName].push(fileObj);
                req.body[fieldName+"_urls"].push(publicUrl);
            } else {

                req.body[fieldName] = [req.body[fieldName], fileObj];
                req.body[fieldName+"_urls"] = [req.body[fieldName+"_urls"], publicUrl];
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



