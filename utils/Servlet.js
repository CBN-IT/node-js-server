const {getCircularReplacer} = require('./Utils');
const admin = require('firebase-admin');
if(admin.apps.length === 0){
    admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
}
const db = admin.firestore();


// const Datastore = require('@google-cloud/datastore');
// const db = new Datastore({});

const SaveForm = require('./SaveForm');

class Servlet{
    constructor(req, res){
        this.res = res;
        this.req = req;
        this.logger = this.req.log;
    }

    get db(){
        return Servlet._db;
    }
    get requiredLogin(){
        return true;
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

    async getAccount(_companyId){
        if(this._account === undefined){
            let user = await this.getUser();
            if(user == null){
                this._account = null;
            } else if(this._isAdmin(user)){
                this._account = Object.assign(user, {tipCont: 'SuperAdmin', _companyId: _companyId ? _companyId : this.req.param['_companyId'], emailCont: user['email']})
            } else {
                let snapshot = this.db.collection('account').where('_deleted', '==', null).where('accountEmail', '==', user.email);
                _companyId =_companyId ? _companyId : this.req.param['_companyId'];
                if(_companyId ){
                    snapshot = snapshot.where('_companyId', '==', _companyId ? _companyId : this.req.param['_companyId']);
                }
                snapshot = await snapshot.get();
                let accounts = this.processDocuments(snapshot, 'account');
                this._account = accounts.length > 0 ? accounts[0] : null;
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
        if (this.requiredLogin && await this.getAccount() === null) {
            throw new Error("Invalid user");
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

    async save(merge){
        let saveForm = new SaveForm(this);
        if(merge){
            return await saveForm.saveWithMerge();
        } else {
            return await saveForm.save();
        }
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
        Object.keys(newData).forEach(key => {
            if(newData[key] === undefined){
                delete newData[key];
            }
        });
        let doc;
        if (_id !== undefined && _id !== '') {
            doc = await this.db.collection(_companyId !== 'default' ? `company/${_companyId}/${collection}` : collection).doc(_id).set(newData, {merge: !!merge});
        } else {
            doc = await this.db.collection(_companyId !== 'default' ? `company/${_companyId}/${collection}` : collection).add(newData);
        }
        return {_id: _id ? _id : doc.id, ...newData};
    }

    async getDocument(_companyId, collection, _id){
        let doc = await this.db.collection(_companyId !== 'default' ? `company/${_companyId}/${collection}` : collection).doc(_id).get();
        if(doc.exists){
            return {_id: doc.id, ...doc.data()};
        }
        return {};
    }

}
Servlet._db = db;
module.exports = Servlet;
