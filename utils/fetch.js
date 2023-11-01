const https = require('https');
async function fetch(url) {
    return new Promise((resolve, reject) => {
        let req = https.request(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                resolve(data);
            });
        });
        req.on("error", (err) => {
            reject(err);
        });
        req.end();
    })
}

module.exports.fetch = fetch;