const Servlet = require('./../utils/Servlet');
const getAsList = require("../utils/getAsList");
class SaveReport extends Servlet {

    static url = '/SaveReport';

    async execute() {
        let collection = 'report';
        let _id = this.req.param['_id'];
        let _companyId = this.req.param['_companyId'];

        let newData = {
            'reportName': this.req.param['reportName'],
            'groupName': this.req.param['groupName'] || "",
            'type': this.req.param['type'],
            'generator': this.req.param['generator'],
            'collection': this.req.param['collection'],
            'code': this.req.paramNoXSSCheck['code'],
            'params': this.req.paramNoXSSCheck['params'],
            'importTemplates': getAsList(this.req.param['importTemplates']),
            '_deleted': null
        };
        return await this.updateDocument(_companyId, collection, _id, newData);
    }

}
module.exports = SaveReport;