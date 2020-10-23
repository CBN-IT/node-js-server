const Servlet = require('./../utils/Servlet');
class SaveReport extends Servlet {

    static url = '/SaveReport';

    async execute() {
        let collection = 'report';
        let _id = this.req.param['_id'];
        let _companyId = this.req.param['_companyId'];
        let importTemplates =this.req.param['importTemplates'] ? this.req.param['importTemplates'] instanceof Array ? this.req.param['importTemplates'] : [this.req.param['importTemplates']] : [];
        let newData = {
            'reportName': this.req.param['reportName'],
            'groupName': this.req.param['groupName']||"",
            'type': this.req.param['type'],
            'generator': this.req.param['generator'],
            'collection': this.req.param['collection'],
            'code': this.req.param['code'],
            'params': this.req.param['params'],
            'importTemplates': importTemplates,
            '_deleted': null
        };
        return await this.updateDocument(_companyId, collection, _id, newData);
    }

}
module.exports = SaveReport;