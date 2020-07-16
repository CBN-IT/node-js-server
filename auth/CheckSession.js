const Servlet = require('./../utils/Servlet');

class CreateSession extends Servlet {
    static url =["/auth/checkSession"];
    requiredLogin = true;

    async execute() {
        return this.getUser();
    }
}

module.exports = CreateSession;