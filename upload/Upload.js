const {v2beta3} = require('@google-cloud/tasks');
// Instantiates a client.
const client = new v2beta3.CloudTasksClient();
let XLSX = require('xlsx');



const Servlet = require('./../utils/Servlet.js');
class Upload extends Servlet {

    static get url(){
        return '/Upload';
    }

    async execute(){
        let workbook = XLSX.read(this.req.files[0].buffer, {
            type:'buffer',
            cellDates: true,
            dateNF: 'yyyy-mm-dd',
        });
        let rows=XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
            raw:false,
            defval:""
        });
        let promiseArr = [];
        this.renameHeaders(rows);
        for(let i=0;i<rows.length;i++){
            this.logger.d(rows[i]);
            promiseArr.push(createHttpTaskWithToken({
                project:'xpc-enel-vanzari',
                location:"europe-west1",
                payload:JSON.stringify({
                    ...rows[i],
                    _companyId:this.req.param._companyId,
                    collection:this.req.param.collection,
                    hashReport:"test"
                }),
                url:this.req.protocol + "://" + this.req.get('host')+"/SaveClient"
            }));
        }
        await Promise.all(promiseArr);
        this.sendAsJson(rows);
    }
    async renameHeaders(rows){
        let headersToChange = {xlsHeader:"jsonHeader"};
        for(let i=0;i<rows.length;i++){
            for (let j in rows[i]){
                if (!rows[i].hasOwnProperty(j)) continue;

                if (headersToChange[j] !== undefined) {
                    rows[i][headersToChange[j]] = rows[i][j];
                    delete rows[i][j];
                }
            }
        }
    }
    _groupByHeaders(rows){
        let headers = this.groupByHeaders;
        let start = -1;
        let end = -1;
        for (let i = 0; i < rows.length - 1; i++) {
            let same = headers.length !== 0;
            for (let j = 0; j < headers.length; j++) {
                same = same && rows[i][headers[j]] === rows[i + 1][headers[j]]
            }
            if (same) {
                if (start === -1) {
                    start = i;
                }
                end = i + 1;
            } else if (start !== -1) {
                this._mergeRows(rows, start, end);
            }
        }

    }
    _mergeRows(rows,start,end){
        let mergedRow = rows
    }
    get groupByHeaders(){
        return []
    }

}
module.exports = Upload;



async function createHttpTaskWithToken({
    project = 'mso-converter', // Your GCP Project id
    queue = 'default', // Name of your Queue
    location = 'us-central1', // The GCP region of your queue
    url = 'https://raport-test.cbn-it.ro/', // The full url path that the request will be sent to
    email = 'task-invoker@mso-converter.iam.gserviceaccount.com', // Cloud IAM service account
    payload = 'Hello, World!', // The task HTTP request body
    inSeconds = 0 // Delay in task execution
}) {

    const task = {
        httpRequest: {
            httpMethod: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            url,
            /*oidcToken: {
                serviceAccountEmail: email,
            },*/

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
