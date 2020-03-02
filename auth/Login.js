const Servlet = require('./../utils/Servlet');
const uuidv4 = require('uuid/v4');
const {_stringify} = require('./../utils/Utils');
const fs = require("fs");
const path = require("path");

class Login extends Servlet {
    static get url() {
        return ["/login/:error/:extraError", "/login/:error", "/login", "/admin/login/:error/:extraError", "/admin/login/:error", "/admin/login"];
    }

    get requiredLogin() {
        return false;
    }

    async execute() {
        let index = fs.readFileSync(path.join(global.projectRoot, "web", this.indexFile), 'utf8');
        let data = await this._getData();
        this.res.send(index.replace('"data_to_replace"', _stringify(data)));
    }

    get indexFile() {
        return '/login.html';
    }

    async _getData() {
        let data = {};
        let cookie = this.req.cookies.csrfToken;
        if (cookie === undefined) {
            data.csrfToken = uuidv4();
            this.res.cookie('csrfToken', data.csrfToken, {
                maxAge: 10 * 60 * 1000,
                httpOnly: true,
                secure: this.req.protocol === "https",
                sameSite: "lax"
            });
        } else {
            data.csrfToken = cookie;
        }
        data.error = this.req.param.error;
        data.extraError = this.req.param.extraError;
        return data;
    }
}

module.exports = Login;