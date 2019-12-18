const Servlet = require('./../utils/Servlet.js');
class GetDocuments extends Servlet {

    static get url(){
        return '/GetDocuments';
    }

    async execute(){
        let collection = this.req.param['collection'];
        let documents = await this.runQuery(this._companyId, collection);
        this.sendAsJson(documents)
    }
}
module.exports = GetDocuments;