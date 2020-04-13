const GetConfigs = require('./GetConfigs.js');
const {_stringify} = require('./Utils.js');
const fs = require("fs");
const path = require("path");

/**
 * @abstract
 */
class AbstractIndex extends GetConfigs {

    indexFile = 'index.html';
    requiredLogin = false;


    _redirectWithContinue(urlPath) {
        let url = new URL(this.req.protocol + '://' + this.req.get('host') + urlPath);
        url.searchParams.append("continue", this.req.url);
        this.res.redirect(url);
        return url.toString();
    }

    async execute() {
        let user = await this.getUser();
        if (user === null) {
            this._redirectWithContinue('/login');
            return
        }
        let account = await this.getAccount();
        if (account === null || account === undefined) {
            this._redirectWithContinue('/login/no-account/' + user.email);
            return
        }
        if (account.blockedAccess === true) {
            this._redirectWithContinue('/login/account-ban/' + user.email);
            return;
        }
        if (account.blockedAccessCompany === true) {
            this._redirectWithContinue('/login/company-ban/' + account._companyName);
            return
        }
        let index = fs.readFileSync(path.join(global.projectRoot, "web", this.indexFile), 'utf8');
        let data = await this._getData();
        this.res.send(index.replace('"data_to_replace"', _stringify(data)));
    }

    async _getData() {
        let companies = await this.getAllUserCompanies();
        companies.sort((a, b) => a.companyName.localeCompare(b.companyName));
        let _companyId = await this._getDefaultCompany(companies);
        let forms = await this._getForms('server/configs', 'form', _companyId, true);
        let columns = await this._getForms('server/columns', 'column', _companyId, true);
        let reports = await this._getReports('report', _companyId, true);

        return Object.assign({
            _appId: process.env.GOOGLE_CLOUD_PROJECT,
            NODE_ENV: process.env.NODE_ENV,
            _configs: forms,
            _columns: columns,
            _reports: reports,
            _companies: companies,
            _selectedCompany: _companyId,
            _user: await this.getUser()
        }, await this.getData(_companyId));
    }

    /**
     * @abstract
     * @param _companyId
     * @returns {Object}
     */
    getData(_companyId) {
        return {};
    }

    async _getReports(collection, _companyId) {
        let allReports = await this.runQuery('', collection, []);
        if (_companyId !== 'default') {
            let reports = await this.runQuery(_companyId, collection, []);
            allReports = [...allReports, ...reports];
        }
        return allReports;
    }

    async _getDefaultCompany(companies) {
        let account = await this.getAccount();
        let defaultOptions = account ? await this.getDocument('', 'defaultOptions', account.accountEmail) : null;
        let defaultCompany = this.req.param['_companyId'] ? this.req.param['_companyId'] : defaultOptions && defaultOptions.defaultCompany ? defaultOptions.defaultCompany : companies[0]._id;
        if (defaultCompany !== '' && defaultCompany !== 'default' && (!defaultOptions || defaultCompany !== defaultOptions.defaultCompany)) {
            this.updateDocument('', 'defaultOptions', account.accountEmail, {defaultCompany}, true);
        }
        return defaultCompany;
    }
}

module.exports = AbstractIndex;