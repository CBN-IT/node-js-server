const Servlet = require('./../utils/Servlet');
class SaveForm extends Servlet {

    static get url(){
        return '/SaveForm';
    }

    async execute(){
        let collection = 'form';
        let _id = this.req.param['_id'];
        let _firmId = this.req.param['_firmId'];
        let newData = {
            'collection': this.req.param['collection'],
            'code': this.req.param['code'],
            '_deleted': null
        };
        let document = await this.updateDocument(_firmId, collection, _id, newData);
        this.sendAsJson(document)
    }

}
module.exports = SaveForm;