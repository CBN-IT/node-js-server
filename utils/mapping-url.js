const fs = require("fs");
const Servlet = require("./Servlet.js");

function getServlets(folderPaths){
    let servlets = [];
    folderPaths.forEach(folderPath => {
        fs.readdirSync(folderPath).forEach(function(file) {
            let servlet = require(`${folderPath}/${file}`);
            // if (servlet.prototype instanceof Servlet) {
                servlets.push(servlet);
            // }
        });
    });
    return servlets;
}


module.exports = getServlets;