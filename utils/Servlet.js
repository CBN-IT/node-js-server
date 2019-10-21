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
                let snapshot = await this.db.collection('account')
                    .where('_deleted', '==', null)
                    .where('accountEmail', '==', user.email)
                    .get();
                let accounts = this.processDocuments(snapshot, 'account');
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

    async execute(){
        this.sendAsJson({message: 'Execute method not implemented'})
    }

    processDocuments(snapshot, path){
        let toReturn = [];
        snapshot.forEach(doc => {
            let processedData = this._processData(doc.data());
            toReturn.push({_id: doc.id, path: path, ...processedData});
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
        Object.keys(newData).forEach(key => {
            if(newData[key] === undefined){
                delete newData[key];
            }
        });
        let doc;
        if (_id !== undefined && _id !== '') {
            doc = await this.db.collection(_companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection).doc(_id).set(newData, {merge: !!merge});
        } else {
            doc = await this.db.collection(_companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection).add(newData);
        }
        return {_id: _id ? _id : doc.id, ...newData};
    }

    deleteDocument(_companyId, collection, _id) {
        return this.updateDocument(_companyId, collection, _id, {_deleted: new Date()}, true);
    }

    async getDocument(_companyId, collection, _id){
        let doc = await this.db.collection(_companyId !== 'default' && _companyId !== '' ? `company/${_companyId}/${collection}` : collection).doc(_id).get();
        if(doc.exists){
            return {_id: doc.id, ...doc.data()};
        }
        return null;
    }

    async getDocuments(_companyId, collection, _ids){
        let path = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let docRefs = _ids.map(_id => this.db.collection(path).doc(_id));
        let snapshot = await this.db.getAll(...docRefs);
        return snapshot.map(doc => {return {_id: doc.id, ...doc.data()}});
    }

    async runQuery(_companyId, collection, conditions){
        let path = _companyId === '' || _companyId === 'default' ? collection : `company/${_companyId}/${collection}`;
        let query = this.db.collection(path).where('_deleted', '==', null);
        conditions.forEach(condition => query = query.where(condition[0], condition[1], condition[2]));
        return this.processDocuments(await query.get());
    }

}
module.exports = Servlet;
