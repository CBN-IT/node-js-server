const Servlet = require('./../utils/Servlet.js');
class GetDocuments extends Servlet {

    static get url(){
        return '/GetDocuments';
    }

    async execute(){
        let collection = this.req.param['collection'];
        let _companyId = this.req.param['_companyId'];
        let path = _companyId !== 'default' ? `company/${_companyId}/${collection}` : collection;
        let snapshot = await this.db.collection(path).where('_deleted', '==', null).get();
        let documents = this.processDocuments(snapshot, path);
        this.sendAsJson(documents)
    }
}
module.exports = GetDocuments;