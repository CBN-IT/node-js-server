const Servlet = require('./../utils/Servlet.js');
const {NotFoundError} = require("../utils/errors");

class GetDocument extends Servlet {

    static url = '/GetDocument';
    requiredParams = ["collection", '_id'];

    async execute() {
        let collection = this.req.param['collection'];
        let _id = this.req.param['_id'];
        let doc = await this.getDocument(this._companyId, collection, _id);
        if (doc !== null) {
            return doc;
        }
        throw new NotFoundError(`Document with id "${_id}" was not found`);
    }
}

module.exports = GetDocument;