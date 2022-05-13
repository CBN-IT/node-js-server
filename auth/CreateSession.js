const Servlet = require('./../utils/Servlet');
const admin = require('firebase-admin');
const {AuthenticationError} = require("../utils/errors");

class CreateSession extends Servlet {
    static url =['/CreateSession',"/auth/createSession"];
    requiredLogin = false;
    requiredParams = ["csrfToken", "idToken"];

    async execute() {
        if (this.req.param.csrfToken !== this.req.cookies.csrfToken) {
            let error = new AuthenticationError("csrfToken from param does not match the value in cookies");
            error.csrfTokenParam = this.req.param.csrfToken;
            error.csrfTokenCookie = this.req.cookies.csrfToken;

            throw error;
        }
        const expiresIn = 14 * 24 * 60 * 60 * 1000;
        // Create the session cookie. This will also verify the ID token in the process.
        // The session cookie will have the same claims as the ID token.
        // To only allow session cookie setting on recent sign-in, auth_time in ID token
        // can be checked to ensure user was recently signed in before creating a session cookie.
        if (!admin.apps.some((app)=>{
            this.logger.d(app.name)
            return app.name==="[DEFAULT]"
        })) {
            admin.initializeApp({
                projectId: process.env.GOOGLE_CLOUD_PROJECT
            });
        }

        let sessionCookie = await admin.auth().createSessionCookie(this.req.param.idToken, {expiresIn});
        // Set cookie policy for session cookie.
        const options = {
            maxAge: expiresIn,
            httpOnly: true,
            secure: this.req.protocol === "https",
            sameSite: "lax"
        };
        this.res.cookie('session', sessionCookie, options);
        //this.res.clearCookie('csrfToken', options);
        return admin.auth().verifySessionCookie(sessionCookie);
    }
}

module.exports = CreateSession;
