const Servlet = require('./../utils/Servlet.js');
class GetDocuments extends Servlet {

    static get url(){
        return '/GetDocuments';
    }

    async execute(){
        let collection = this.req.param['collection'];
        let _firmId = this.req.param['_firmId'];
        let path = _firmId !== 'default' ? `firm/${_firmId}/${collection}` : collection;
        let snapshot = await this.db.collection(path).where('_deleted', '==', null).get();
        let documents = this.processDocuments(snapshot, path);
        this.sendAsJson(documents)
    }
}
module.exports = GetDocuments;