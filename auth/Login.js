const Servlet = require('./../utils/Servlet');
const uuidv4 = require('uuid/v4');
const BASE = process.env.NODE_ENV === 'development' ? 'build/dev/' : '';
const {_stringify} = require('./../utils/Utils');
const fs = require("fs");
const path = require('path');


class Login extends Servlet {
    static get url(){
        return "/login";
    }
    async execute(){
        console.log(path.join(__dirname, '../../../' + BASE + this.indexFile));
        let index = fs.readFileSync(path.join(__dirname, '../../../' + BASE + this.indexFile), 'utf8');
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
                secure: process.env.NODE_ENV !== 'development',
                sameSite: "lax"
            });
        } else {
            data.csrfToken = cookie;
        }
        return data;
    }
}

module.exports = Login;