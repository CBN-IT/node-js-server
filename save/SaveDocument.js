const SaveForm = require('./../utils/SaveForm.js');

class SaveDocument extends SaveForm {

    static url = '/SaveDocument';

    async execute(){
        return await this.save();
    }

}
module.exports = SaveDocument;