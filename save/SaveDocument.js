const SaveForm = require('./../utils/SaveForm.js');

class SaveDocument extends SaveForm {

    static get url(){
        return '/SaveDocument';
    }

    async execute(){
        let document = await this.save();
        this.sendAsJson(document)
    }

}
module.exports = SaveDocument;