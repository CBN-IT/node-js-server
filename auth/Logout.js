const Servlet = require('./../utils/Servlet');

class Logout  extends Servlet {
    static get url() {
        return '/logout';
    }

    async execute() {
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: "lax"
        };
        this.res.clearCookie('session',options);
        this.res.redirect('/login');
    }
}

module.exports = Logout;