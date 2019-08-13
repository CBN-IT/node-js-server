const express = require('express');
const path = require(`path`);
const bodyParser = require("body-parser");
const {requestParam, timeout} = require('./utils/Utils');
const {logginMiddleware} = require('logging-js');
const fs = require(`fs`);
const app = express();

const {sendUploadToGCS,multer} = require('./utils/file-uploat-gcs.js');

const getServlets = require('./utils/mapping-url.js');
const mappingUrls = getServlets([
    path.join(__dirname, "/auth"),
    path.join(__dirname, "/get"),
    path.join(__dirname, "/save"),
    path.join(__dirname, "../../server/save"),
    path.join(__dirname, "../../server/index"),
    path.join(__dirname, "../../server/get"),
    // path.join(__dirname, "../../server/auth"),
]);
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(logginMiddleware());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(multer.any());
app.use(sendUploadToGCS(`${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`));//jshnfkjhsdkjfhkljsdhfkjsdhjkfd

app.use(requestParam);

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV;
const BASE = (NODE_ENV === 'development') ? 'build/dev/' : '';
app.use('/node_modules', express.static(path.join(__dirname, '../../' + BASE + 'node_modules')));
app.use('/web', express.static(path.join(__dirname, '../../web')));


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});


mappingUrls.forEach(servlet => {
    app.all(servlet.url, async (req, res) => {
        let processor = new servlet(req,res);
        try {
            await processor.checkLogin();
            await processor.validate();
        } catch (error) {
            req.log.w(error);
            res.status(401);
            res.send(error.message);
            return;
        }

        try {
            await Promise.race([
                processor.execute(),
                timeout(55)
            ]);
            // req.log.i("SUCCESS");
        } catch (error){
            req.log.w(error);
            res.status(400);
            res.send(error.message);
        }
    });
});