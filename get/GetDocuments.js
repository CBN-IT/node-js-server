const Servlet = require('./../utils/Servlet.js');
class GetDocuments extends Servlet {

    static url = '/GetDocuments';
    requiredParams = ["_companyId","collection"];

    async execute(){
        let collection = this.req.param['collection'];
        return await this.runQuery(this._companyId, collection);
    }
}
module.exports = GetDocuments;