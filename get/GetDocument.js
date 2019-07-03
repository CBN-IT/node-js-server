const Servlet = require('./../utils/Servlet.js');
class GetDocument extends Servlet {

    static get url(){
        return '/GetDocument';
    }

    async execute(){
        let collection = this.req.param['collection'];
        let _firmId = this.req.param['_firmId'];
        let _id = this.req.param['_id'];
        let document = {};

        let doc = await this.db.collection(_firmId !== 'default' ? `firm/${_firmId}/${collection}` : collection).doc(_id).get();

        if(doc.exists){
            document = {_id: doc.id, ...doc.data()};
        }

        this.sendAsJson(document)
    }

}
module.exports = GetDocument;