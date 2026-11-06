const Servlet = require('./../utils/Servlet.js');
class GetAccounts extends Servlet {

    static url = '/GetAccounts';

    async execute(){
        let _companyId = this.req.param['_companyId'];
        if (_companyId === "default") {
            _companyId = null;
        }
        return await this.runQuery('', "account", [['_companyId', '==', _companyId]]);
    }
}
module.exports = GetAccounts;