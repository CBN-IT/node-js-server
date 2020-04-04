const fs = require("fs");
const Servlet = require("./Servlet.js");

function getServlets(folderPaths) {
    let servlets = [];
    folderPaths.forEach(folderPath => {
        fs.readdirSync(folderPath).forEach(function (file) {
            let servlet = require(`${folderPath}/${file}`);
            if (servlet.prototype instanceof Servlet && servlet.url !== null) {
                servlets.push(servlet);
            } else {
                console.log(`SKIPPED file !!!!!!!!!!!!!! ${folderPath}/${file}`)
            }
        });
    });
    return servlets;
}


module.exports = getServlets;