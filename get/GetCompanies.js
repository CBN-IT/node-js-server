const Servlet = require('node-js-server/utils/Servlet.js');

class GetCompanies extends Servlet {

    static get url(){
        return '/GetCompanies';
    }

    async execute(){
        let companies = await this.runQuery('', 'company', [['_deleted', '==', null]]);
        this.sendAsJson(companies)
    }
}

module.exports = GetCompanies;