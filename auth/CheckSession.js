const Servlet = require('./../utils/Servlet');

class CheckSession extends Servlet {
    static url = ["/auth/checkSession"];
    requiredLogin = true;

    async execute() {
        return this.getUser();
    }
}

module.exports = CheckSession;
