const {getCircularReplacer} = require('./Utils');
const admin = require('firebase-admin');
if(admin.apps.length === 0){
    console.log(process.env.GOOGLE_CLOUD_PROJECT);
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
        return false;
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
    async validate(){
        return true;
    }

    async checkLogin() {
        if (this.requiredLogin && await this.getUser() === null) {
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
            toReturn.push({_id: doc.id, path: path, ...doc.data()});
        });
        return toReturn;
    }

    async updateDocument(_firmId, collection, _id, newData, merge) {
        let doc;
        if (_id !== undefined) {
            doc = await this.db.collection(_firmId !== 'default' ? `firm/${_firmId}/${collection}` : collection).doc(_id).set(newData, {merge: !!merge});
        } else {
            doc = await this.db.collection(_firmId !== 'default' ? `firm/${_firmId}/${collection}` : collection).add(newData);
        }
        return {_id: _id ? _id : doc.id, ...newData};
    }

    async getDocument(_firmId, collection, _id){
        let doc = await this.db.collection(_firmId !== 'default' ? `firm/${_firmId}/${collection}` : collection).doc(_id).get();
        if(doc.exists){
            return {_id: doc.id, ...doc.data()};
        }
        return {};
    }

}
Servlet._db = db;
module.exports = Servlet;
