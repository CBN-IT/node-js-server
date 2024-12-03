const Servlet = require('./../utils/Servlet');
const {stringify} = require('./../utils/stringify');
const {nanoid} = require('nanoid');
const fs = require("fs");
const path = require("path");

class Login extends Servlet {
    static url = ["/login/:error/:extraError", "/login/:error", "/login", "/admin/login/:error/:extraError", "/admin/login/:error", "/admin/login"];
    requiredLogin = false;


    async execute() {
        let index = fs.readFileSync(path.join(global.projectRoot, "web", this.indexFile), 'utf8');
        let data = await this._getData();
        this.res.send(index.replace('"data_to_replace"', stringify(data)));
    }

    get indexFile() {
        return '/login.html';
    }

    async _getData() {
        let data = {};
        let cookie = this.req.cookies.csrfToken;
        if (cookie === undefined || cookie === "") {
            data.csrfToken = nanoid(100);
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