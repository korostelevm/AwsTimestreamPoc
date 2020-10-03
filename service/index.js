var constants = require('./constants')
var moment = require('moment')
var _ = require('lodash')


const AWS = require("aws-sdk");
AWS.config.update({
    region: constants.AWS_REGION,
  });

var https = require('https');
var agent = new https.Agent({
    maxSockets: 5000
});

const writeClient = new AWS.TimestreamWrite({
        maxRetries: 10,
        httpOptions: {
            timeout: 20000,
            agent: agent
        }
    });  
queryClient = new AWS.TimestreamQuery();
var q = require('./query')
/*
{
  idx: '361',
  index: '1601712155.393100',
  dt: '2020-10-03 08:02:35.393100023',
  num_artifacts: '-3',
  artifacts: "['DocumentProcessingVirtualAssistantInspectionApplication dba36550', 'ExtractionUI 0d15455e', 'RetrieveIntakeFilesService 73a26e42']",
  state: 'fail',
  duration: '-0.7128875'
}
*/
const writeRecords = async function (record) {
        console.log("Writing records");
        // const currentTime = Date.now().toString(); // Unix time in milliseconds
     
        const dimensions = [
            {'Name': 'artifacts', 'Value': record.artifacts},
            {'Name': 'index', 'Value': record.index},
            {'Name': 'state', 'Value': record.state}
        ];
     
        const r = {
            'Dimensions': dimensions,
            'MeasureName': 'duration',
            'MeasureValue': record.duration,
            'MeasureValueType': 'DOUBLE',
            'Time': (moment(record.dt)._d.getTime()+_.random(100)).toString()
        };
        const records = [r];
     
        const params = {
            DatabaseName: constants.DATABASE_NAME,
            TableName: constants.TABLE_NAME,
            Records: records
        };
     
        const promise = writeClient.writeRecords(params).promise();
     
        return promise
    }
    
var run_query = async function(i){
    console.log(i)
    var t0 = Date.now();
    var qr = 'SELECT * FROM "totry"."totry_table2" WHERE time > ago(2h) ORDER BY time DESC LIMIT 10000'
    console.log(qr)
    var res = await q.getAllRows(qr)
    var t1 = Date.now();
    console.log(`got ${res.Rows.length} rows, took ${t1 - t0} milliseconds`)
    return res
}

var handler = async function(event, context){
    // console.log(writeClient)
    for (var i=0; i<100; i++){
        await run_query(i)
    }


    return false
}

handler({},{})
module.exports = {
    writeRecords,
    handler
}