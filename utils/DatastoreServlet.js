const admin = require('firebase-admin');
const SaveForm = require("./SaveForm")
const {Datastore} = require('@google-cloud/datastore');
let datastoreTimeout = {
    gaxOptions: {timeout: 5000}
};

module.exports = class DatastoreServlet extends SaveForm{


    /**
     *
     * @type {admin.firestore.Firestore}
     */
    get db() {
        return Servlet._db;
    }

    /**
     *
     * @type {BigQuery}
     */
    get bigQueryDb() {
        return Servlet._bigquery;
    }

    /**
     * @private
     */
    _initializeAppAndDatabase() {
        Servlet._db = new Datastore({projectId: process.env.GOOGLE_CLOUD_PROJECT});
    }


    /**
     *
     * @param user
     * @param _companyId
     * @returns {Object}
     * @private
     */
    _getSuperAdminCont(user, _companyId) {
        return Object.assign(user, {accountType: 'SuperAdmin', _companyId, accountEmail: user['email']});
    }


    async runQuery(_companyId, collection, conditions = []) {
        _companyId = _companyId === "" || _companyId==="default"?"":_companyId;
        let query = this.db.createQuery(_companyId,collection);
        conditions.forEach(condition => query = query.filter(...condition));

        let [data] = await this.db.runQuery(query, datastoreTimeout);

        return data;
    }


    async getAllUserCompanies() {
        return super.getAllUserCompanies();
    }

    async _getAllUserCompaniesAdmin() {
        return super._getAllUserCompaniesAdmin();
    }

    async getAccount(_companyId) {
        return super.getAccount(_companyId);
    }

    _isAdmin(user) {
        return super._isAdmin(user);
    }

    async validate() {
        return super.validate();
    }

    processDocuments(snapshot) {
        return super.processDocuments(snapshot);
    }

    async updateDocument(_companyId, collection, _id, newData, merge) {
        return super.updateDocument(_companyId, collection, _id, newData, merge);
    }

    async saveHistory(_companyId, collection, newData) {

    }

    async updateDocumentByPath(_path, newData, merge) {
        return super.updateDocumentByPath(_path, newData, merge);
    }

    async saveHistoryByPath(_path, newData) {
        return super.saveHistoryByPath(_path, newData);
    }


    deleteDocument(_companyId, collection, _id) {
        return super.deleteDocument(_companyId, collection, _id);
    }

    deleteDocumentByPath(_path) {
        return super.deleteDocumentByPath(_path);
    }

    async getDocument(_companyId, collection, _id) {
        return super.getDocument(_companyId, collection, _id);
    }

    async getDocumentByPath(_path) {
        return super.getDocumentByPath(_path);
    }

    async getDocuments(_companyId, collection, _ids) {
        return super.getDocuments(_companyId, collection, _ids);
    }

    async getDocumentsByPath(_paths) {
        return super.getDocumentsByPath(_paths);
    }

    async runQueryNoDeleted(_companyId, collection, conditions = []) {
        return super.runQueryNoDeleted(_companyId, collection, conditions);
    }
}

