const Servlet = require('./../utils/Servlet.js');
class GetAccounts extends Servlet {

    static get url(){
        return '/GetAccounts';
    }

    async execute(){
        let collection = this.req.param['collection'];
        let _companyId = this.req.param['_companyId'];
        let snapshot = await this.db.collection(collection).where('_deleted', '==', null).where('_companyId', '==', _companyId).get();
        let documents = this.processDocuments(snapshot);
        this.sendAsJson(documents)
    }
}
module.exports = GetAccounts;