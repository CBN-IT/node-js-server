const Servlet = require('./../utils/Servlet');

class Logout  extends Servlet {
    static get url() {
        return ['/logout',"/logout/:error"];
    }
    get requiredLogin(){
        return false;
    }
    async execute() {
        const options = {
            httpOnly: true,
            secure: this.req.protocol==="https",
            sameSite: "lax"
        };
        this.res.clearCookie('session',options);
        if (this.req.param.error) {
            this.res.redirect('/login/' + this.req.param.error);
        } else {
            this.res.redirect('/login/logout');
        }
    }
}

module.exports = Logout;