const Servlet = require('./../utils/Servlet');
class GetUser extends Servlet {

    static get url(){
        return '/GetUser';
    }
    get requiredLogin(){
        return true;
    }
    async execute(){
        this.sendAsJson(await this.getUser());

    }
}
module.exports = GetUser;