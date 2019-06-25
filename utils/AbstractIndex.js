const GetForms = require('./../get/GetForms');
const {_stringify} = require('./../utils/Utils');
const path = require('path');
const fs = require("fs");
const BASE = process.env.NODE_ENV === 'development' ? 'build/dev/' : '';

class AbstractIndex extends GetForms{

    get indexFile(){
        return 'index.html';
    }
    async execute(){
        if(await this.getUser() === null){
            this.res.redirect('/login');
            return;
        }

        let index = fs.readFileSync(path.join(__dirname, '../../' + BASE + this.indexFile), 'utf8');
        let data = await this._getData();
        this.res.send(index.replace('"data_to_replace"', _stringify(data)));
    }

    async _getData(){
        let snapshot = await this.db.collection('firm').where('_deleted', '==', null).get();
        let firms = [...this.processDocuments(snapshot), {_id: 'default', firmName: 'Default'}];
        let _firmId = this.req.param['firmId'] === 'default' ? 'default' : this.req.param['firmId'] ? this.req.param['firmId'] : firms[0]._id;
        let forms = await this._getForms('configs', 'form', _firmId, true);
        let columns = await this._getForms('columns', 'columns', _firmId, true);
        let reports = await this._getReports('report', _firmId, true);


        // let invoiceSettings = await this.getDocument(_firmId, 'setari', 'setariFactura');
        // let invoiceSettings = await this.getDocument(_firmId, 'setari', 'setariFactura');
        return {
            _appId: process.env.GOOGLE_CLOUD_PROJECT,
            _configs: forms,
            _columns: columns,
            _reports: reports,
            _firms: firms,
            _selectedFirm: _firmId,
            _user: await this.getUser(),
            ...this.getData()
        };
    }

    getData(){
        return {};
    }

    async _getReports(collection, _firmId){
        let snapshotDefault = await this.db.collection(collection).where('_deleted', '==', null).get();
        let allReports = this.processDocuments(snapshotDefault, 'report');

        if(_firmId !== 'default'){
            let snapshot = await this.db.collection(`firm/${_firmId}/${collection}`).where('_deleted', '==', null).get();
            let reports = this.processDocuments(snapshot, `firm/${_firmId}/${collection}`);
            allReports = [...allReports, ...reports];
        }

        return allReports;
    }
}

module.exports = AbstractIndex;