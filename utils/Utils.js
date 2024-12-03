const {TimeoutError} = require("./errors");
const timeout = (nrSec) => {
    return new Promise((resolve, reject) => {
        setTimeout(reject, nrSec * 1000, new TimeoutError('TIMEOUT ' + nrSec + "s"));
    });
};
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return undefined;
            }
            seen.add(value);
        }
        return value;
    };
};
const redirectToHttps = (req, res, next) => {
    let hostname = req.hostname;
    let appspotReg = /^([^.]+)\.([^.]+)\.((ew\.r\.)?appspot\.com)$/g;

    if (req.protocol === 'https' ||
        req.headers["x-appengine-cron"] !== undefined ||
        req.headers["x-appengine-taskname"] !== undefined ||
        req.headers.host.includes('localhost')) {

        next();
    } else if (appspotReg.test(hostname)) {
        res.redirect('https://' + hostname.replace(appspotReg, "$1-dot-$2.$3") + req.originalUrl);
    } else {
        res.redirect('https://' + hostname + req.originalUrl);
    }
};


module.exports = {timeout, getCircularReplacer, redirectToHttps};