const Servlet = require('./../utils/Servlet');
const {getAuth } = require('firebase-admin/auth');


class Logout extends Servlet {
    static url = ['/auth/logout'];
    requiredLogin = false;

    async execute() {
        const sessionCookie = req.cookies.session || '';

        const options = {
            httpOnly: true,
            secure: this.req.protocol === "https",
            sameSite: "lax"
        };
        this.res.clearCookie('session', options);

        getAuth()
            .verifySessionCookie(sessionCookie)
            .then((decodedClaims) => {
                return getAuth().revokeRefreshTokens(decodedClaims.sub);
            })
            .catch((error) => {
            });

        return true;
    }
}

module.exports = Logout;