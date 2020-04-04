const Servlet = require('./../utils/Servlet.js');
class GetAccounts extends Servlet {

    static url = '/GetAccounts';

    async execute(){
        let collection = this.req.param['collection'];
        let _companyId = this.req.param['_companyId'];
        return await this.runQuery('', collection, [['_companyId', '==', _companyId]]);
    }
}
module.exports = GetAccounts;