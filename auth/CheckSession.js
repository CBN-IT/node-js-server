const Servlet = require('./../utils/Servlet');
const {AuthenticationError} = require("../utils/errors");

class CheckSession extends Servlet {
    static url = ["/auth/checkSession"];
    requiredLogin = false;

    async execute() {
        let user = await this.getUser();
        if(user===null){
            throw new AuthenticationError("No user")
        }
        return user;
    }
}

module.exports = CheckSession;
