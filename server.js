const {TimeoutError, AuthorizationError, AuthenticationError, ValidationError, RequiredFieldError, NotFoundError} = require("./utils/errors.js");

const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const {requestParam, timeout, redirectToHttps} = require('./utils/Utils');
const {logginMiddleware} = require('logging-js');


const {sendUploadToGCS, multer} = require('./utils/file-uploat-gcs.js');
const getServlets = require('./utils/mapping-url.js');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV;
const BASE = (NODE_ENV === 'development') ? 'build/dev/' : '';

let lastModified = new Date(Number((process.env.GAE_DEPLOYMENT_ID || 0) * 1 / (2 << 27) * 1000)).toUTCString()

function addStatic(app, map) {
    for (let i in map) {
        if (!map.hasOwnProperty(i)) continue;
        app.use(i, express.static(map[i], {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.setHeader('Last-Modified', lastModified)
                }
            },
        }));
    }
}

function addMappings(app, arr) {
    const mappingUrls = getServlets(arr);
    mappingUrls.forEach(servlet => {
        app.all(servlet.url, async (req, res) => {
            let processor = new servlet(req, res);
            try {
                await processor.checkLogin();
                await processor.validate();
                let value = await Promise.race([
                    processor.execute(),
                    timeout(55)
                ]);
                if (!res.headersSent) {
                    if (value !== undefined) {
                        processor.sendAsJson(value);
                    } else {
                        throw new Error("The servlet did not return anything and it didn't call sendAsJson");
                    }
                }
            } catch (error) {
                if (error instanceof TimeoutError) {
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
                } else if (error instanceof AuthorizationError) {
                    req.log.w(error);
                    if (req.xhr) {
                        res.status(401);
                    } else {
                        res.redirect('/logout/unauthorized');
                        return;
                    }
                } else if (error instanceof ValidationError) {
                    req.log.w(error);
                    res.status(400);
                } else if (error instanceof NotFoundError) {
                    req.log.w(error);
                    res.status(404);
                } else if (error instanceof RequiredFieldError) {
                    req.log.w(error);
                    res.status(422);
                } else {
                    req.log.s(error);

                    res.status(500);
                }
                if (process.env.NODE_ENV !== "development") {
                    req.log.d(JSON.parse(JSON.stringify(req.param)));
                }
                res.setHeader('Content-Type', 'application/json; charset=UTF-8');
                res.send(JSON.stringify(error));
            }
        });
    });
}

function startApp() {
    const app = express();
    app.set('trust proxy', true);
    app.use('/robots.txt', function (req, res) {
        res.type('text/plain');
        res.send("User-agent: *\nDisallow: /");
    });
    app.use(redirectToHttps);
    app.use(cookieParser());
    app.use(logginMiddleware());
    app.use(bodyParser.json({limit: "50mb"}));
    app.use(bodyParser.urlencoded({extended: false, limit: "50mb", parameterLimit:10000}));

    app.use(multer.any());
    app.use(requestParam);
    app.use(sendUploadToGCS(`${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`));

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}...`);
    });
    addMappings(app, [
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