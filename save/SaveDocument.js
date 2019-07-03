const Servlet = require('./../utils/Servlet.js');
class SaveDocument extends Servlet {

    static get url(){
        return '/SaveDocument';
    }

    async execute(){
        let document = await this.save(false);
        this.sendAsJson(document)
    }

}
module.exports = SaveDocument;