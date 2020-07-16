const Servlet = require('./../utils/Servlet');
const {nanoid} = require('nanoid');

class CreateSession extends Servlet {
    static url = '/auth/csrf';
    requiredLogin = false;

    async execute() {
        let data = {};
        data.csrfToken = nanoid(100);
        this.res.cookie('csrfToken', data.csrfToken, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: this.req.protocol === "https",
            sameSite: "lax"
        });
        return data;
    }
}

module.exports = CreateSession;