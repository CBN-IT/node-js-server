const Servlet = require('./../utils/Servlet');
const admin = require('firebase-admin');

class CreateSession extends Servlet {
    static get url() {
        return '/CreateSession';
    }

    get requiredLogin(){
        return false;
    }

    async execute() {
        if (this.req.param.csrfToken !== this.req.cookies.csrfToken) {
            this.logger.w(this.req.param.csrfToken, this.req.cookies.csrfToken);
            this.res.status(401).send('UNAUTHORIZED REQUEST!');
            return;
        }
        const expiresIn = 14 * 24 * 60 * 60 * 1000;
        // Create the session cookie. This will also verify the ID token in the process.
        // The session cookie will have the same claims as the ID token.
        // To only allow session cookie setting on recent sign-in, auth_time in ID token
        // can be checked to ensure user was recently signed in before creating a session cookie.
        admin.auth().createSessionCookie(this.req.param.idToken, {expiresIn})
            .then((sessionCookie) => {
                // Set cookie policy for session cookie.
                const options = {
                    maxAge: expiresIn,
                    httpOnly: true,
                    secure: this.req.protocol==="https",
                    sameSite: "lax"
                };
                this.res.cookie('session', sessionCookie, options);
                this.res.clearCookie('csrfToken',options);
                this.res.end(JSON.stringify({status: 'success'}));
            }, error => {
                this.res.status(401).send('UNAUTHORIZED REQUEST!');
            });
    }
}

module.exports = CreateSession;