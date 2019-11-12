const GetConfigs = require('../get/GetConfigs.js');
const {_stringify} = require('./Utils.js');
const fs = require("fs");


class AbstractIndex extends GetConfigs{

    get indexFile(){
        return 'index.html';
    }

    get requiredLogin(){
        return false;
    }

    async execute(){
        let user = await this.getUser();
        if(user===null){
            this.res.redirect('/login');
            return;
        }
        let account = await this.getAccount();
        if(account === null){
            this.res.redirect('/login/no-account/'+user.email);
            return;
        }
        if(account.blockedAccess===true){
            this.res.redirect('/login/account-ban/'+user.email);
            return;
        }
        if(account.blockedAccessCompany===true){
            this.res.redirect('/login/company-ban/'+account._companyName);
            return;
        }
        let index = fs.readFileSync(global.projectRoot + this.indexFile, 'utf8');
        let data = await this._getData();
        this.res.send(index.replace('"data_to_replace"', _stringify(data)));
    }

    async _getData(){
        let companies = await this.getAllUserCompanies();
        let _companyId = await this._getDefaultCompany(companies);
        let forms = await this._getForms('server/configs', 'form', _companyId, true);
        let columns = await this._getForms('server/columns', 'column', _companyId, true);
        let reports = await this._getReports('report', _companyId, true);


        // let invoiceSettings = await this.getDocument(_firmId, 'setari', 'setariFactura');
        // let invoiceSettings = await this.getDocument(_firmId, 'setari', 'setariFactura');
        return Object.assign({
            _appId: process.env.GOOGLE_CLOUD_PROJECT,
            _configs: forms,
            _columns: columns,
            _reports: reports,
            _companies: companies,
            _selectedCompany: _companyId,
            _user: await this.getUser()
        }, await this.getData(_companyId));
    }

    getData(_companyId){
        return {};
    }

    async _getReports(collection, _companyId){
        let snapshotDefault = await this.db.collection(collection).where('_deleted', '==', null).get();
        let allReports = this.processDocuments(snapshotDefault, 'report');

        if(_companyId !== 'default'){
            let snapshot = await this.db.collection(`company/${_companyId}/${collection}`).where('_deleted', '==', null).get();
            let reports = this.processDocuments(snapshot, `company/${_companyId}/${collection}`);
            allReports = [...allReports, ...reports];
        }

        return allReports;
    }

    async _getDefaultCompany(companies){
        let account = await this.getAccount();
        let defaultOptions = account ? await this.getDocument('', 'defaultOptions', account.accountEmail) : null;
        let defaultCompany = this.req.param['_companyId'] ? this.req.param['_companyId'] : defaultOptions && defaultOptions.defaultCompany ? defaultOptions.defaultCompany : companies[0]._id;
        if(defaultCompany !== '' && defaultCompany !== 'default'){
        this.updateDocument('', 'defaultOptions', account.accountEmail, {defaultCompany}, true);
        }
        return defaultCompany;
    }

}

module.exports = AbstractIndex;