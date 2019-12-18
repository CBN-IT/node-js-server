const Servlet = require('./../utils/Servlet.js');
class GetAccounts extends Servlet {

    static get url(){
        return '/GetAccounts';
    }

    async execute(){
        let collection = this.req.param['collection'];
        let _companyId = this.req.param['_companyId'];
        let documents = await this.runQuery('', collection, [['_companyId', '==', _companyId]]);
        this.sendAsJson(documents)
    }
}
module.exports = GetAccounts;