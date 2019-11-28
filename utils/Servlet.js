const {getCircularReplacer} = require('./Utils');
const admin = require('firebase-admin');

class Servlet{
    constructor(req, res){
        this.res = res;
        this.req = req;
        this.logger = this.req.log;
        this._companyId = this.req.param._companyId;
        this.initializeAppAndDatabase();
    }

    get db(){
        return Servlet._db;
    }
    get requiredUserType(){
        return [];
    }
    get requiredLogin(){
        return true;
    }

    get requiredCompanyIdParam(){
        return false;
    }

    get requiredParams(){
        return [];
    }

    initializeAppAndDatabase(){
        if(admin.apps.length === 0){
            admin.initializeApp({
                projectId: process.env.GOOGLE_CLOUD_PROJECT
            });
            Servlet._db = admin.firestore();
        }
    }

    async getUser() {
        if (this._user === undefined) {
            const sessionCookie = this.req.cookies.session || '';
            if (sessionCookie === "") {
                this._user = null;
            } else {
                this._user = await admin.auth().verifySessionCookie(sessionCookie);
            }
        }
        return this._user;
    }

    async getAllUserCompanies() {
        let user = await this.getUser();
        if (user == null) {
            return [];
        } else if (this._isAdmin(user)) {
            return await this._getAllUserCompaniesAdmin();
        } else {
            let accounts = await this.runQuery("",'account',[
                ['accountEmail', '==', user.email]
            ]);
            let ids = new Set();
            for (let i = 0; i < accounts.length; i++) {
                if(accounts[i].accountType==="SuperAdmin"){
                    return await this._getAllUserCompaniesAdmin();
                }
                ids.add(accounts[i]._companyId);
            }
            ids = [...ids];
            if(ids.length===0){
                return [];
            }
            return this.getDocuments("", "company", [...ids])
        }
    }
    async _getAllUserCompaniesAdmin(){
        return [
            ...await this.runQuery('', 'company', [['_deleted', '==', null]]),
            {
                _id: 'default',
                companyName: 'Default'
            }
        ];
    }
    _getSuperAdminCont(user,_companyId){
        return Object.assign(user, {accountType: 'SuperAdmin', _companyId, accountEmail: user['email']});
    }
    async getAccount(_companyId){
        if(this._account === undefined){
            _companyId =_companyId ? _companyId : this.req.param['_companyId'];
            let user = await this.getUser();
            if(user == null){
                this._account = null;
            } else if(this._isAdmin(user)){
                this._account = this._getSuperAdminCont(user, _companyId);
            } else {
                let accounts = await this.runQuery('', 'account', [['accountEmail', '==', user.email]]);
                if (_companyId) {
                    for (let i = 0; i < accounts.length; i++) {
                        if (accounts[i].accountType === "SuperAdmin") {
                            return this._account = this._getSuperAdminCont(user, _companyId);
                        } else if (accounts[i]._companyId === _companyId) {
                            return this._account = accounts[i];
                        }
                    }
                } else {
                    return this._account = accounts.length > 0 ? accounts[0] : null;
                }
            }
        }
        return this._account;
    }

    _isAdmin(user){
        return user !== null && (user.email === 'octavianvoloaca@gmail.com' || user.email === 'bogdan.nourescu@cbn-it.ro');
    }

    async validate(){
        if(this.requiredCompanyIdParam && !this._companyId){
            throw new Error("Invalid company id");
        } else {
            let missingParams = [];
            this.requiredParams.forEach(param => {
                if(!this.req.param[param]){
                    missingParams.push(param);
                }
            });
            if(missingParams.length > 0){
                throw new Error("Invalid params: " + missingParams.join());
            }
        }
        return true;
    }

    async checkLogin() {
        if (this.requiredLogin) {
            let account = await this.getAccount();
            if (account === null) {
                throw new Error("Invalid user");
            }
            if (this.requiredUserType.length > 0 && account.accountType !== "SuperAdmin") {
                if (!this.requiredUserType.includes(account.accountType)) {
                    throw new Error("Invalid user");
                }
            }
        }
    }
    sendAsJson(str) {
        this.res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        if (typeof str === "string") {
            this.res.send(str);
        } else {
            this.res.send(JSON.stringify(str, getCircularReplacer()));
        }
    }

    sendError(str){
        this.res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        if (typeof str === "string") {
            this.res.status(400).send(str);
        } else {
            this.res.status(400).send(JSON.stringify(str, getCircularReplacer()));
        }
    }

    async execute(){
        this.sendAsJson({message: 'Execute method not implemented'})
    }

    processDocuments(snapshot){
        let toReturn = [];
        snapshot.forEach(doc => {
            let processedData = this._processData(doc.data());
            toReturn.push({_id: doc.id, _path: doc.ref.path, ...processedData});
        });
        return toReturn;
    }

    _processData(data){
        Object.entries(data).forEach(([key, value]) => {
            let keys = key.split('.');
            if(keys.length > 1){
                data[keys[0]] = data[keys[0]] ? data[keys[0]] : {};
                data[keys[0]][keys[1]] = value;
                delete data[key];
            }
        });
        return data;
    }

    async updateDocument(_companyId, collection, _id, newData, merge) {
        _id = !_id && newData.uniqueId ? newData.data[newData.uniqueId] : _id;
        newData = newData.uniqueId  ? newData.data : newData;
        newData = this.cleanObject(newData);
        let _path = _companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection;
        newData._pathCollection = _path;
        let doc = _id ? await this.db.collection(_path).doc(_id).set(newData, {merge: !!merge}) : await this.db.collection(_path).add(newData);
        return _id ? {_id: _id, _path: `${_path}/${_id}`, ...newData} : {_id: doc.id, _path: doc.path, ...newData};
    }

    async updateDocumentByPath(_path, newData, merge){
        let doc = await this.db.doc(_path).set(newData, {merge: !!merge});
        return {_path, ...newData};
    }

    cleanObject(newData){
        Object.keys(newData).forEach(key => {
            if(newData[key] === undefined){
                delete newData[key];
            }
        });
        return newData;
    }

    deleteDocument(_companyId, collection, _id) {
        return this.updateDocument(_companyId, collection, _id, {_deleted: new Date()}, true);
    }

    deleteDocumentByPath(_path) {
        return this.updateDocumentByPath(_path, {_deleted: new Date()}, true);
    }

    async getDocument(_companyId, collection, _id){
        let _pathCollection = _companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection;
        return this.getDocumentByPath(`${_pathCollection}/${_id}`)
    }

    async getDocumentByPath(_path){
        let doc = await this.db.doc(_path).get();
        if(doc.exists){
            return {_id: doc.id, ...doc.data(), _path: _path};
        }
        return null;
    }

    async getDocuments(_companyId, collection, _ids){
        let _pathCollection = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let _paths = _ids.map(_id => `${_pathCollection}/${_id}`)
        return this.getDocumentsByPath(_paths);
    }

    async getDocumentsByPath(_paths){
        if(!_paths || _paths.length === 0){
            return [];
        }
        let docRefs = _paths.map(_path => this.db.doc(_path));
        let snapshot = await this.db.getAll(...docRefs);
        return snapshot.map(doc => {return {_id: doc.id, _path: doc.ref.path, ...doc.data()}});
    }

    async runQuery(_companyId, collection, conditions = []){
        let _pathCollection = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let query = this.db.collection(_pathCollection).where('_deleted', '==', null);
        conditions.forEach(condition => query = query.where(condition[0], condition[1], condition[2]));
        return this.processDocuments(await query.get(), _pathCollection);
    }

}
module.exports = Servlet;
