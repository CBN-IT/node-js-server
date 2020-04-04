const Servlet = require('./../utils/Servlet.js');
const {NotFoundError} =  require("../utils/errors");

class GetDocument extends Servlet {

    static url = '/GetDocument';
    requiredParams = ["_companyId","collection",'_id'];

    async execute() {
        let collection = this.req.param['collection'];
        let _companyId = this.req.param['_companyId'];
        let _id = this.req.param['_id'];
        let doc = await this.db.collection(_companyId !== 'default' ? `company/${_companyId}/${collection}` : collection).doc(_id).get();

        if (doc.exists) {
            return {_id: doc.id, ...doc.data()};
        }
        throw new NotFoundError(`Document with id "${_id}" was not found`);
    }
}
module.exports = GetDocument;