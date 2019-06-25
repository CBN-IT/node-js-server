const path = require('path');
const fs = require("fs");
class SaveForm{

    constructor(servletInstance){
        this.servletInstance = servletInstance;
    }

    async getUpdatedData(){
        let collection = this.servletInstance.req.param['collection'];
        let _firmId = this.servletInstance.req.param['_firmId'];
        let config = await this._getConfig(_firmId, collection);
        return config.uniqueId ? {data: this._processData(config), uniqueId : config.uniqueId} : this._processData(config);
    }

    async saveWithMerge(newData){
        return this._processSave(newData, true);
    }

    async save(newData){
        return this._processSave(newData, false);
    }

    async _processSave(newData, merge){
        let _id = this.servletInstance.req.param['_id'];
        newData = newData ? newData : await this.getUpdatedData();
        let _firmId = this.servletInstance.req.param['_firmId'];
        let collection = this.servletInstance.req.param['collection'];
        return await this._updateDocument(_firmId, collection, _id, newData, merge)
    }

    async _updateDocument(_firmId, collection, _id, newData, merge) {
        _id = !_id && newData.uniqueId ? newData.data[newData.uniqueId] : _id;
        newData = newData.uniqueId  ? newData.data : newData;
        if (_id !== undefined) {
            await this.servletInstance.db.collection(_firmId !== 'default' ? `firm/${_firmId}/${collection}`: collection).doc(_id).set(newData, {merge: !!merge});
            return {...newData, _id};
        } else {
            let response = await this.servletInstance.db.collection(_firmId !== 'default' ? `firm/${_firmId}/${collection}` : collection).add(newData);
            return {...newData, _id: response.id}
        }
    }


    _processData(config){
        let newData = {_deleted: null};
        config.elements.forEach(field => {
            let value = this.servletInstance.req.param[field.name];
            if(value !== undefined){
                switch (field['dbType']){
                    case 'string':
                        newData[field.name] = value;
                        break;
                    case 'boolean':
                        newData[field.name] = value === 'true';
                        break;
                    case 'integer':
                        if(!isNaN(parseInt(value))){
                            newData[field.name] = parseInt(value);
                        }
                        break;
                    case 'double':
                        if(!isNaN(parseFloat(value))){
                            newData[field.name] = parseFloat(value);
                        }
                        break;
                    case 'list':
                        newData[field.name] = value;
                        break;
                    case 'file':

                }
            }
            if(field.type === 'select' && field['saveLabel']){
                newData[`${field.name}_label`] = this.servletInstance.req.param[`${field.name}_label`];
            }
        });
        if(config.label){
            newData._label = config.label.map(property => newData[property]).join(" ");
        }
        return newData;
    }

    async _getConfig(_firmId, collection){

        //get from namespace
        if(_firmId !== 'default'){
            let snapshot = await this.servletInstance.db.collection(`firm/${_firmId}/form`).where('collection', '==', collection).get();
            let config = this.servletInstance.processDocuments(snapshot)[0];
            if(config){
                return JSON.parse(config.code);
            }
        }

        //get from empty namespace
        let snapshotDefault = await this.servletInstance.db.collection('form').where('collection', '==', collection).get();
        let configDefault = this.servletInstance.processDocuments(snapshotDefault)[0];
        if(configDefault){
            return JSON.parse(configDefault.code);
        }

        //get from file
        try{
            let contents = fs.readFileSync(path.join(__dirname, `../configs/${collection}.json` ), 'utf8');
            return JSON.parse(contents);
        } catch(err){
            this.servletInstance.logger.w(`No config found for ${collection}`);
            console.log(`No config found for ${collection}`);
            return null;
        }

    }

}



module.exports = SaveForm;
