const Servlet = require('./../utils/Servlet');
const admin = require('firebase-admin');


class Logout extends Servlet {
    static url = ['/auth/logout'];
    requiredLogin = false;

    async execute() {
        let user = await this.getUser();
        console.log(user);

        const options = {
            httpOnly: true,
            secure: this.req.protocol === "https",
            sameSite: "lax"
        };
        this.res.clearCookie('session', options);
        return true;
    }
}

module.exports = Logout;