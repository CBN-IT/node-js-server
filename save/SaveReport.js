const Servlet = require('./../utils/Servlet');
class SaveReport extends Servlet {

    static get url(){
        return '/SaveReport';
    }

    async execute(){
        let collection = 'report';
        let _id = this.req.param['_id'];
        let _companyId = this.req.param['_companyId'];
        let newData = {
            'reportName': this.req.param['reportName'],
            'type': this.req.param['type'],
            'generator': this.req.param['generator'],
            'collection': this.req.param['collection'],
            'code': this.req.param['code'],
            'params': this.req.param['params'],
            '_deleted': null
        };
        let document = await this.updateDocument(_companyId, collection, _id, newData);
        this.sendAsJson(document)
    }

}
module.exports = SaveReport;