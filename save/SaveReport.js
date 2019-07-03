const Servlet = require('./../utils/Servlet');
class SaveReport extends Servlet {

    static get url(){
        return '/SaveReport';
    }

    async execute(){
        let collection = 'report';
        let _id = this.req.param['_id'];
        let _firmId = this.req.param['_firmId'];
        let newData = {
            'reportName': this.req.param['reportName'],
            'type': this.req.param['type'],
            'generator': this.req.param['generator'],
            'collection': this.req.param['collection'],
            'code': this.req.param['code'],
            'params': this.req.param['params'],
            '_deleted': null
        };
        let document = await this.updateDocument(_firmId, collection, _id, newData);
        this.sendAsJson(document)
    }

}
module.exports = SaveReport;