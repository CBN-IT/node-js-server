const {ValidationError} = require("../utils/errors");
const GetConfigs = require('../utils/GetConfigs');

class SaveColumn extends GetConfigs {

    static url = '/SaveColumn';

    async execute() {
        let collection = 'column';
        let _id = this.req.param['_id'];
        let _companyId = this.req.param['_companyId'];

        //test if the new data has changed. If it didn't change, don't save it
        let columns = await this._getForms('server/columns', collection, _companyId, false);
        let oldCode = JSON.stringify(columns[_id].code);//getForms return the code as an object
        let code = JSON.stringify(JSON.parse(this.req.paramNoXSSCheck['code']));//to remove whitespace
        if (code === oldCode) {
            throw new ValidationError("Setarile de coloana nu au fost modificate.")
        }

        let newData = {
            'collection': collection,
            'code': code,
            '_deleted': null
        };
        return await this.updateDocument(_companyId, collection, _id, newData);
    }

}
module.exports = SaveColumn;