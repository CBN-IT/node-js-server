const GetConfigs = require('../get/GetConfigs.js');
const {_stringify} = require('./Utils.js');
const fs = require("fs");
const path = require("path");

class AbstractIndex extends GetConfigs{

    get indexFile(){
        return 'index.html';
    }

    get requiredLogin(){
        return false;
    }
    _redirectWithContinue(urlPath){
        let url = new URL(this.req.protocol + '://' + this.req.get('host') + urlPath);
        url.searchParams.append("continue", this.req.url);
        this.res.redirect(url);
        return url.toString();
    }
    async execute(){
        let user = await this.getUser();
        console.log(this.req.url);
        if (user === null) {
            return this._redirectWithContinue('/login');
        }
        let account = await this.getAccount();
        if (account === null || account === undefined) {
            return this._redirectWithContinue('/login/no-account/' + user.email);
        }
        if (account.blockedAccess === true) {
            return this._redirectWithContinue('/login/account-ban/' + user.email);
        }
        if (account.blockedAccessCompany === true) {
            return this._redirectWithContinue('/login/company-ban/' + account._companyName);
        }
        let index = fs.readFileSync(path.join(global.projectRoot, "web", this.indexFile), 'utf8');
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
        let allReports = await this.runQuery('', collection, []);
        if(_companyId !== 'default'){
            let reports = await this.runQuery(_companyId, collection, []);
            allReports = [...allReports, ...reports];
        }

        return allReports;
    }

    async _getDefaultCompany(companies){
        let account = await this.getAccount();
        let defaultOptions = account ? await this.getDocument('', 'defaultOptions', account.accountEmail) : null;
        let defaultCompany = this.req.param['_companyId'] ? this.req.param['_companyId'] : defaultOptions && defaultOptions.defaultCompany ? defaultOptions.defaultCompany : companies[0]._id;
        if(defaultCompany !== '' && defaultCompany !== 'default' && (!defaultOptions || defaultCompany  !== defaultOptions.defaultCompany)){
        this.updateDocument('', 'defaultOptions', account.accountEmail, {defaultCompany}, true);
        }
        return defaultCompany;
    }

}

module.exports = AbstractIndex;