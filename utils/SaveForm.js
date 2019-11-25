const path = require('path');
const fs = require("fs");
const Servlet = require('./Servlet.js');

class SaveForm extends Servlet {

    async saveWithMerge(newData) {
        return this._processSave(newData, true);
    }

    async save(newData) {
        return this._processSave(newData, false);
    }

    async _processSave(newData, merge) {

        let _id = this.req.param['_id'];
        newData = newData ? newData : await this.getUpdatedData();
        let _companyId = this.req.param['_companyId'];
        return await this.updateDocument(_companyId, this.req.param.collection, _id, newData, merge)
    }

    async getUpdatedData() {
        this.config = this.config ? this.config : await this._getConfig();
        return this.config.uniqueId && this.config.uniqueId !== '' ? {
            data: this._getFormData(this.config),
            uniqueId: this.config.uniqueId
        } : this._getFormData(this.config);
    }

    _getFormData(config) {
        let newData = {_deleted: null};
        config.elements.forEach(field => {
            if (field['dbType'] === 'address') {
                this._processAdress(newData, field);
                return;
            }
            let value = this._getValue(field.multiple, this.req.param[field.name], field.type);
            if (value !== undefined) {
                switch (field['dbType']) {
                    case 'string':
                        newData[field.name] = value;
                        break;
                    case 'boolean':
                        newData[field.name] = value === 'true';
                        break;
                    case 'integer':
                        if (!isNaN(parseInt(value))) {
                            newData[field.name] = parseInt(value);
                        }
                        break;
                    case 'double':
                        if (!isNaN(parseFloat(value))) {
                            newData[field.name] = parseFloat(value);
                        }
                        break;
                    case 'list':
                        newData[field.name] = value;
                        break;
                    case 'file':
                        newData[field.name] = value;
                        newData[field.name + "_urls"] = this._getValue(field.multiple, this.req.param[field.name + "_urls"], field.type);
                        break;
                }
            }
            if (field.type === 'select' && field['saveLabel'] && this.req.param[`${field.name}_label`]) {
                newData[`${field.name}_label`] = this.req.param[`${field.name}_label`];
            }
        });
        if (config.label) {
            newData._label = config.label.map(property => newData[property]).join(" ");
        }
        return newData;
    }

    _getValue(multiple, value, fieldType) {
        if (multiple) {
            if (!(value instanceof Array)) {
                if (value === '') {
                    return [];
                } else if (value) {
                    return [value];
                }
            }
        } else if (fieldType === 'file') {
            if (value instanceof Array) {
                return value[0];
            }
        }
        return value;
    }

    _processAdress(newData, field) {
        if (this.req.param[`${field.name}.id`]) {
            // newData[`${field.name}.nume_localitate`] = this.servletInstance.req.param[`${field.name}.nume_localitate`];
            // newData[`${field.name}.nume_superior`] = this.servletInstance.req.param[`${field.name}.nume_superior`];
            // newData[`${field.name}.nume_judet`] = this.servletInstance.req.param[`${field.name}.nume_judet`];
            // newData[`${field.name}.id`] = this.servletInstance.req.param[`${field.name}.id`];
            // newData[`${field.name}.ancestor`] = this.servletInstance.req.param[`${field.name}.ancestor`];
            // newData[`${field.name}.label`] = this.servletInstance.req.param[`${field.name}_label`];
            newData[`${field.name}_label`] = this.req.param[`${field.name}_label`];
            newData[field.name] = {
                nume_localitate: this.req.param[`${field.name}.nume_localitate`],
                nume_superior: this.req.param[`${field.name}.nume_superior`],
                nume_judet: this.req.param[`${field.name}.nume_judet`],
                id: this.req.param[`${field.name}.id`],
                ancestor: this.req.param[`${field.name}.ancestor`],
                label: this.req.param[`${field.name}_label`]
            };
        } else {
            // newData[`${field.name}.nume_localitate`] = '';
            // newData[`${field.name}.nume_superior`] = '';
            // newData[`${field.name}.nume_judet`] = '';
            // newData[`${field.name}.id`] = '';
            // newData[`${field.name}.ancestor`] = '';
            // newData[`${field.name}.label`] = '';
            newData[`${field.name}_label`] = '';
            newData[field.name] = {
                nume_localitate: '',
                nume_superior: '',
                nume_judet: '',
                id: '',
                ancestor: '',
                label: ''
            };
        }
    }

    async _getConfig(collection) {
        collection = collection ? collection : this.req.param['collection'];
        let _companyId = this.req.param['_companyId'];
        //get from namespace
        if (_companyId !== 'default') {
            let snapshot = await this.db.collection(`company/${_companyId}/form`).where('collection', '==', collection).get();
            let config = this.processDocuments(snapshot)[0];
            if (config) {
                return JSON.parse(config.code);
            }
        }

        //get from empty namespace
        let snapshotDefault = await this.db.collection('form').where('collection', '==', collection).get();
        let configDefault = this.processDocuments(snapshotDefault)[0];
        if (configDefault) {
            return JSON.parse(configDefault.code);
        }

        //get from file
        try {
            let contents = fs.readFileSync(path.join(global.projectRoot, `/server/configs/${collection}.json`), 'utf8');
            return JSON.parse(contents);
        } catch (err) {
            this.logger.w(`No config found for ${collection}`);
            return null;
        }

    }

    setConfig(config) {
        this.config = config;
    }

}


module.exports = SaveForm;
