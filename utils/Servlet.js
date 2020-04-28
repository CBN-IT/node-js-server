const {AuthenticationError, AuthorizationError, RequiredFieldError, ValidationError} = require("./errors");
const {getCircularReplacer} = require('./Utils');
const admin = require('firebase-admin');
const {BigQuery} = require('@google-cloud/bigquery');

/**
 * A database document
 * @typedef {Object} DatabaseDocument
 * @property {String} _id the id of the document
 * @property {String} _path the path of the document in the database. it can have 2 formats: company/company_id/collection/_id or collection/_id
 */

/**
 * A company entity
 * @typedef {DatabaseDocument} Company
 * @property {String} companyName
 * @property {String} companyId
 * @property {String} companyType
 */

/**
 * A database document or null
 * @typedef {null|DatabaseDocument} NullableDatabaseDocument
 */
/**
 * Logger
 * @typedef {Object} CBNLogger
 * @property {Function} d
 * @property {Function} i
 * @property {Function} w
 * @property {Function} s
 * @property {Function} tag
 */

/**
 * This is the base class for all the API calls <br />
 * You need to override it and override <br/>
 * {@link Servlet#execute} <br/>
 * {@link Servlet.url} <br/>
 * @abstract
 */
class Servlet {

    /**
     * @abstract
     * @type {string|Array}
     */
    static url = null;

    /**
     *
     * @type {Array}
     */
    requiredUserType = [];

    /**
     *
     * @type {boolean}
     */
    requiredLogin = true;
    /**
     * Extend it and return an array of params that are mandatory to be able to process the request
     * @type {Array<String>}
     */
    requiredParams = [];
    /**
     *
     * @param {Express.Request} req
     * @param {Express.Response} res
     */
    constructor(req, res) {
        /** @type {Express.Response} */
        this.res = res;
        /** @type {Express.Request} */
        this.req = req;
        /** @type {CBNLogger} */
        this.logger = this.req.log;
        this._companyId = this.req.param._companyId;
        this._initializeAppAndDatabase();
        this.logger.tag("companyId", this._companyId);
    }

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
        if (admin.apps.length === 0) {
            admin.initializeApp({
                projectId: process.env.GOOGLE_CLOUD_PROJECT
            });
            Servlet._db = admin.firestore();
            Servlet._bigquery = new BigQuery({});
        } else if (Servlet._db === undefined) {
            Servlet._db = admin.apps[0].firestore();
            Servlet._bigquery = new BigQuery({});
        }
    }

    /**
     * @returns {Promise<null|admin.auth.DecodedIdToken>}
     */
    async getUser() {
        if (this._user === undefined) {
            const sessionCookie = (this.req.cookies && this.req.cookies.session) || '';
            if (sessionCookie === "") {
                this._user = null;
            } else {
                try {
                    this._user = await admin.auth().verifySessionCookie(sessionCookie);
                } catch (e) {
                    this.res.clearCookie('session', {
                        httpOnly: true,
                        secure: this.req.protocol === "https",
                        sameSite: "lax"
                    });
                    throw new AuthenticationError(e.message);
                }
            }
        }
        this.logger.tag("user", this._user ? this._user.email : null);
        return this._user;
    }

    /**
     * @returns {Promise<Company[]>}
     */
    async getAllUserCompanies() {
        let user = await this.getUser();
        if (user == null) {
            return [];
        } else if (this._isAdmin(user)) {
            return await this._getAllUserCompaniesAdmin();
        } else {
            let accounts = await this.runQuery("", 'account', [
                ['accountEmail', '==', user.email]
            ]);
            let ids = new Set();
            for (let i = 0; i < accounts.length; i++) {
                if (accounts[i].accountType === "SuperAdmin") {
                    return await this._getAllUserCompaniesAdmin();
                }
                ids.add(accounts[i]._companyId);
            }
            ids = [...ids];
            if (ids.length === 0) {
                return [];
            }
            return this.getDocuments("", "company", [...ids])
        }
    }

    /**
     *
     * @returns {Promise<Company[]>}
     * @private
     */
    async _getAllUserCompaniesAdmin() {
        return [
            ...await this.runQuery('', 'company', [['_deleted', '==', null]]),
            {
                _id: 'default',
                companyName: 'Default'
            }
        ];
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

    /**
     *
     * @param _companyId
     * @returns {Promise<null|Object>}
     */
    async getAccount(_companyId) {
        if (this._account === undefined) {
            _companyId = _companyId ? _companyId : this.req.param['_companyId'];
            let user = await this.getUser();
            if (user == null) {
                this._account = null;
            } else if (this._isAdmin(user)) {
                this._account = this._getSuperAdminCont(user, _companyId);
            } else {
                let accounts = await this.runQuery('', 'account', [['accountEmail', '==', user.email]]);
                if (_companyId) {
                    for (let i = 0; i < accounts.length; i++) {
                        if (accounts[i].accountType === "SuperAdmin") {
                            this._account = this._getSuperAdminCont(user, _companyId);
                            return this._account;
                        } else if (accounts[i]._companyId === _companyId) {
                            this._account = accounts[i];
                            return this._account;
                        }
                    }
                } else {
                    this._account = accounts.length > 0 ? accounts[0] : null;
                }
            }
        }
        return this._account;
    }

    /**
     *
     * @param user
     * @returns {Boolean}
     * @private
     */
    _isAdmin(user) {
        return user !== null && (
            user.email === 'octavianvoloaca@gmail.com' ||
            user.email === 'bogdan.nourescu@cbn-it.ro'
        );
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    async validate() {
        if (this.requiredParams.length === 0) {
            return true;
        }
        let missingParams = this.requiredParams.filter(param =>
            this.req.param[param] == null ||
            this.req.param[param] === "" ||
            (param === "_companyId" && this.req.param[param] === "default"));
        if (missingParams.length === 0) {
            return true;
        }
        throw new RequiredFieldError("Invalid params: " + missingParams.join(", "));
    }

    /**
     *
     * @returns {Promise<void>}
     * @throws {AuthenticationError|AuthorizationError}
     */
    async checkLogin() {
        if (this.requiredLogin) {
            let account = await this.getAccount();
            if (account === null) {
                throw new AuthenticationError("No user");
            }
            if (this.requiredUserType.length > 0 && account.accountType !== "SuperAdmin") {
                if (!this.requiredUserType.includes(account.accountType)) {
                    throw new AuthorizationError("Invalid user type");
                }
            }
        }
    }

    /**
     *
     * @param {Array|Object|String} str
     */
    sendAsJson(str) {
        this.res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        if (typeof str === "string") {
            this.res.send(str);
        } else {
            this.res.send(JSON.stringify(str, getCircularReplacer()));
        }
    }

    /**
     *
     * @param {String|Object}str
     */
    sendError(str) {
        if (typeof str === "string") {
            throw new ValidationError(str);
        } else {
            if (str.message) {
                let error = new ValidationError(str.message);
                for (let [key, val] of Object.entries(str)) {
                    error[key] = val;
                }
                throw error;
            } else {
                throw new ValidationError(JSON.stringify(str, getCircularReplacer()));
            }
        }
    }

    /**
     * Execute the code and return the value to send as response
     * @returns {Promise<String|Object|Array|void>}
     * @abstract
     */
    async execute() {
        throw new Error('Execute method not implemented');
    }

    /**
     *
     * @param snapshot
     * @returns {DatabaseDocument[]}
     */
    processDocuments(snapshot) {
        let toReturn = [];
        snapshot.forEach(doc => {
            let processedData = this._processData(doc.data());
            toReturn.push({_id: doc.id, _path: doc.ref.path, ...processedData});
        });
        return toReturn;
    }

    /**
     *
     * @param data
     * @returns {*}
     * @private
     */
    _processData(data) {
        Object.entries(data).forEach(([key, value]) => {
            let keys = key.split('.');
            if (keys.length > 1) {
                data[keys[0]] = data[keys[0]] ? data[keys[0]] : {};
                data[keys[0]][keys[1]] = value;
                delete data[key];
            }
        });
        return data;
    }

    /**
     *
     * @param _companyId
     * @param collection
     * @param _id
     * @param newData
     * @param merge
     * @returns {Promise<DatabaseDocument>}
     */
    async updateDocument(_companyId, collection, _id, newData, merge) {
        _id = !_id && newData.uniqueId ? newData.data[newData.uniqueId] : _id;
        newData = newData.uniqueId ? newData.data : newData;
        newData = this.cleanObject(newData);
        let _path = _companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection;
        newData._pathCollection = _path;
        let doc = _id ? await this.db.collection(_path).doc(_id).set(newData, {merge: !!merge}) : await this.db.collection(_path).add(newData);
        let savedData = _id ? {_id: _id, _path: `${_path}/${_id}`, ...newData} : {
            _id: doc.id,
            _path: doc.path, ...newData
        };
        this.saveHistory(_companyId, collection, savedData);
        return savedData;
    }

    /**
     *
     * @param _companyId
     * @param collection
     * @param newData
     * @returns {Promise<google.datastore.v1.ICommitResponse>}
     */
    async saveHistory(_companyId, collection, newData) {
        let account = await this.getAccount() || {};
        let fields = Object.entries(newData).map(([key, value]) => {
            return {name: key, value: typeof value === "string" ? value : JSON.stringify(value)}
        });
        let row = {
            company: _companyId,
            collection: collection,
            id: newData._id,
            date: new Date(),
            account: account._id,
            accountEmail: account.accountEmail,
            field: fields
        };
        return this.bigQueryDb.dataset("history")
            .table("history")
            .insert([row])
            .catch(() => {
            });
    }

    /**
     *
     * @param _path
     * @param newData
     * @param merge
     * @returns {Promise<DatabaseDocument>}
     */
    async updateDocumentByPath(_path, newData, merge) {
        let doc = await this.db.doc(_path).set(newData, {merge: !!merge});
        let savedData = {_path, ...newData};
        this.saveHistoryByPath(_path, newData);
        return savedData;
    }

    /**
     *
     * @param _path
     * @param newData
     * @returns {Promise<google.datastore.v1.ICommitResponse[]>}
     */
    async saveHistoryByPath(_path, newData) {
        let splits = _path.split('/');
        return splits.length === 2 ?
            this.saveHistory('', splits[0], {...newData, _id: splits[1]}) :
            this.saveHistory(splits[1], splits[2], {...newData, _id: splits[3]});
    }

    /**
     *
     * @param newData
     * @returns {*}
     */
    cleanObject(newData) {
        Object.keys(newData).forEach(key => {
            if (newData[key] === undefined) {
                delete newData[key];
            }
        });
        return newData;
    }

    /**
     *
     * @param _companyId
     * @param collection
     * @param _id
     * @returns {Promise<DatabaseDocument>}
     */
    deleteDocument(_companyId, collection, _id) {
        return this.updateDocument(_companyId, collection, _id, {_deleted: new Date()}, true);
    }

    /**
     *
     * @param _path
     * @returns {Promise<DatabaseDocument>}
     */
    deleteDocumentByPath(_path) {
        return this.updateDocumentByPath(_path, {_deleted: new Date()}, true);
    }

    /**
     *
     * @param _companyId
     * @param collection
     * @param _id
     * @returns {Promise<NullableDatabaseDocument>}
     */
    async getDocument(_companyId, collection, _id) {
        let _pathCollection = _companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection;
        return this.getDocumentByPath(`${_pathCollection}/${_id}`)
    }

    /**
     *
     * @param _path
     * @returns {Promise<NullableDatabaseDocument>}
     */
    async getDocumentByPath(_path) {
        let doc = await this.db.doc(_path).get();
        if (doc.exists) {
            return {_id: doc.id, ...doc.data(), _path: _path};
        }
        return null;
    }

    /**
     *
     * @param _companyId
     * @param collection
     * @param _ids
     * @returns {Promise<DatabaseDocument[]>}
     */
    async getDocuments(_companyId, collection, _ids) {
        let _pathCollection = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let _paths = _ids.map(_id => `${_pathCollection}/${_id}`)
        return this.getDocumentsByPath(_paths);
    }

    /**
     *
     * @param _paths
     * @returns {Promise<DatabaseDocument[]>}
     */
    async getDocumentsByPath(_paths) {
        if (!_paths || _paths.length === 0) {
            return [];
        }
        let docRefs = _paths.map(_path => this.db.doc(_path));
        let snapshot = await this.db.getAll(...docRefs);
        return snapshot.map(doc => {
            return {_id: doc.id, _path: doc.ref.path, ...doc.data()}
        });
    }

    /**
     *
     * @param _companyId
     * @param collection
     * @param conditions
     * @returns {Promise<DatabaseDocument[]>}
     */
    async runQuery(_companyId, collection, conditions = []) {
        let _pathCollection = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let query = this.db.collection(_pathCollection).where('_deleted', '==', null);
        conditions.forEach(condition => query = query.where(condition[0], condition[1], condition[2]));
        return this.processDocuments(await query.get(), _pathCollection);
    }
    /**
     *
     * @param _companyId
     * @param collection
     * @param conditions
     * @returns {Promise<DatabaseDocument[]>}
     */
    async runQueryNoDeleted(_companyId, collection, conditions = []) {
        let _pathCollection = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let query = this.db.collection(_pathCollection);
        conditions.forEach(condition => query = query.where(condition[0], condition[1], condition[2]));
        return this.processDocuments(await query.get(), _pathCollection);
    }
}

module.exports = Servlet;
