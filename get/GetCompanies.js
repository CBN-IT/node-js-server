const Servlet = require('../utils/Servlet.js');

class GetCompanies extends Servlet {

    static url = '/GetCompanies';

    async execute() {
        let account = await this.getAccount(this._companyId);
        if (account.accountType === "SuperAdmin") {
            return await this.runQuery('', 'company', [['_deleted', '==', null]]);
        } else {
            return [await this.getDocument('', 'company', this._companyId)]
        }
    }
}

module.exports = GetCompanies;