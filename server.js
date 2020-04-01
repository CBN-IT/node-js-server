const {TimeoutError,AuthorizationError,AuthenticationError,ValidationError,RequiredFieldError} =require("./utils/errors.js");

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
                await Promise.race([
                    processor.execute(),
                    timeout(55)
                ]);
            } catch (error){
                if(error instanceof TimeoutError){
                    req.log.w(error);
                    res.status(408);
                } else if (error instanceof AuthenticationError) {
                    req.log.i(error);
                    if (req.xhr) {
                        res.status(401);
                    } else {
                        res.redirect('/login');
                        return;
                    }
                } else if(error instanceof AuthorizationError){
                    req.log.w(error);
                    if (req.xhr) {
                        res.status(401);
                    } else {
                        res.redirect('/logout/unauthorized');
                        return;
                    }
                } else if(error instanceof ValidationError){
                    req.log.w(error);
                    res.status(400);
                } else if(error instanceof RequiredFieldError){
                    req.log.w(error);
                    res.status(422);
                } else {
                    req.log.s(error);
                    res.status(500);
                }
                res.setHeader('Content-Type', 'application/json; charset=UTF-8');
                res.send(JSON.stringify(error));
            }
        });
    });
}

function startApp(){
    const app = express();
    app.use('/robots.txt', function (req, res) {
        res.type('text/plain');
        res.send("User-agent: *\nDisallow: /");
    });
    app.use(redirectToHttps);
    app.use(cookieParser());
    app.use(logginMiddleware());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false, limit:"5mb"}));

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