const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const {requestParam, timeout, redirectToHttps} = require('./utils/Utils');
const {logginMiddleware} = require('logging-js');


const {sendUploadToGCS,multer} = require('./utils/file-uploat-gcs.js');
const getServlets = require('./utils/mapping-url.js');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV;
const BASE = (NODE_ENV === 'development') ? 'build/dev/' : '';

function addStatic(app,map){
    for(let i in map){
        if(!map.hasOwnProperty(i))continue;
        app.use(i, express.static(map[i]));
    }
}

function addMappings(app,arr){
    const mappingUrls = getServlets(arr);
    mappingUrls.forEach(servlet => {
        app.all(servlet.url, async (req, res) => {
            let processor = new servlet(req,res);
            try {
                await processor.checkLogin();
                await processor.validate();
            } catch (error) {
                if(req.xhr){
                    req.log.w(error);
                    res.status(401);
                    res.send(error.message);
                    return;
                }else{
                    res.redirect('/logout/unauthorized');
                    return;
                }
            }

            try {
                await Promise.race([
                    processor.execute(),
                    timeout(55)
                ]);
            } catch (error){
                req.log.w(error);
                res.status(400);
                res.send(error.message);
            }
        });
    });
}

function startApp(){
    const app = express();
    app.use(redirectToHttps);
    app.use(cookieParser());
    app.use(logginMiddleware());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));

    app.use(multer.any());
    app.use(requestParam);
    app.use(sendUploadToGCS(`${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`));

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}...`);
    });
    addMappings(app,[
        path.join(__dirname, "./auth"),
        path.join(__dirname, "./get"),
        path.join(__dirname, "./save")
    ]);
    return app;
}

module.exports = {
    addMappings,
    BASE,
    addStatic,
    startApp
};