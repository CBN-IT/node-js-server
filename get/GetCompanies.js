const Servlet = require('../utils/Servlet.js');

class GetCompanies extends Servlet {

    static url = '/GetCompanies';

    async execute(){
        return await this.runQuery('', 'company', [['_deleted', '==', null]]);
    }
}

module.exports = GetCompanies;