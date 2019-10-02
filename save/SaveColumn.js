const Servlet = require('./../utils/Servlet');
class SaveColumn extends Servlet {

    static get url(){
        return '/SaveColumn';
    }

    async execute(){
        let collection = 'column';
        let _id = this.req.param['_id'];
        let _companyId = this.req.param['_companyId'];
        let newData = {
            'collection': this.req.param['collection'],
            'code': this.req.param['code'],
            '_deleted': null
        };
        let document = await this.updateDocument(_companyId, collection, _id, newData);
        this.sendAsJson(document)
    }

}
module.exports = SaveColumn;