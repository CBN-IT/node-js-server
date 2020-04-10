const {v2beta3} = require('@google-cloud/tasks');
// Instantiates a client.
const client = new v2beta3.CloudTasksClient();
let XLSX = require('xlsx');


const Servlet = require('./../utils/Servlet.js');

class Upload extends Servlet {

    static url = '/Upload';

    async execute() {
        let workbook = XLSX.read(this.req.files[0].buffer, {
            type: 'buffer',
            cellDates: true,
            dateNF: 'yyyy-mm-dd',
        });
        let rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
            raw: false,
            defval: ""
        });
        let promiseArr = [];
        //await this.renameHeaders(rows);
        let out = this._processGroupByHeaders(rows);
        for (let i = 0; i < out.length; i++) {
            this.logger.d(out[i]);
            promiseArr.push(createHttpTaskWithToken({
                project: process.env.GOOGLE_CLOUD_PROJECT,
                location: process.env.GAE_LOCATION,
                payload: JSON.stringify({
                    ...out[i],
                    _companyId: this.req.param._companyId,
                    collection: this.req.param.collection
                }),
                url: this.req.protocol + "://" + this.req.get('host') + this.saveUrl
            }));
        }
        await Promise.all(promiseArr);
        //this.sendAsJson(rows);
        return out;
    }

    async renameHeaders(rows) {
        let headersToChange = {xlsHeader: "jsonHeader"};
        for (let i = 0; i < rows.length; i++) {
            for (let j in rows[i]) {
                if (!rows[i].hasOwnProperty(j)) continue;

                if (headersToChange[j] !== undefined) {
                    rows[i][headersToChange[j]] = rows[i][j];
                    delete rows[i][j];
                }
            }
        }
    }

    _processGroupByHeaders(rows) {
        let out = [{otherRows: rows}];
        this._groupByHeaders(out);
        delete out[0].otherRows;
        return out;
    }

    _groupByHeaders(rows, h) {
        if (h === undefined) {
            h = 0;
        }

        let grH = this.groupByHeaders;
        let kind = grH[h].name;
        for (let i = 0; i < rows.length; i++) {
            rows[i][kind] = [];
            let out = rows[i][kind];
            for (let j = 0; j < rows[i].otherRows.length; j++) {
                let row = rows[i].otherRows[j];
                let prevRow = rows[i].otherRows[j - 1];
                if (j === 0 || this._getUniqueIdVal(row, grH[h]) !== this._getUniqueIdVal(prevRow, grH[h])) {
                    let c = {};
                    for (let [key, val] of Object.entries(row)) {
                        if (key.startsWith(kind)) {
                            c[key] = val;
                        }
                    }
                    out.push(c);
                    out[out.length - 1].otherRows = [];
                }
                out[out.length - 1].otherRows.push(row);
            }
            for (let n = 0; n < grH.length; n++) {
                if (grH[n].parent === kind) {
                    this._groupByHeaders(out, n);
                }
            }
            for (let o = 0; o < out.length; o++) {
                out[o].otherRows = undefined;
            }
        }
    }

    _getUniqueIdVal(row, grH) {
        let h = grH.uniqueId;
        let kind = grH.name;
        let r = [];
        for (let i = 0; i < h.length; i++) {
            r.push(row[kind + "." + h[i]]);
        }
        return r.join("|");
    }

    get groupByHeaders() {
        return []
    }

    get saveUrl() {
        return "/SaveClient"
    }
}

module.exports = Upload;


async function createHttpTaskWithToken({
                                           project = 'mso-converter', // Your GCP Project id
                                           queue = 'default', // Name of your Queue
                                           location = 'us-central1', // The GCP region of your queue
                                           url = 'https://raport-test.cbn-it.ro/', // The full url path that the request will be sent to
                                           payload = 'Hello, World!', // The task HTTP request body
                                           inSeconds = 0 // Delay in task execution
                                       }) {

    const task = {
        httpRequest: {
            httpMethod: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            url,
        },
    };

    if (payload) {
        task.httpRequest.body = Buffer.from(payload);
    }

    if (inSeconds) {
        // The time when the task is scheduled to be attempted.
        task.scheduleTime = {
            seconds: inSeconds + Date.now() / 1000,
        };
    }

    const request = {
        parent: client.queuePath(project, location, queue),
        task: task,
    };

    console.log('Sending task:');
    console.log(task);
    // Send create task request.
    const [response] = await client.createTask(request);
    return response

}

//module.exports = createHttpTaskWithToken;
