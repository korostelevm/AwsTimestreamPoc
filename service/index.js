var constants = require('./constants')
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


const writeRecords = async function () {
        console.log("Writing records");
        const currentTime = Date.now().toString(); // Unix time in milliseconds
     
        const dimensions = [
            {'Name': 'region', 'Value': 'us-east-1'},
            {'Name': 'az', 'Value': 'az1'},
            {'Name': 'hostname', 'Value': 'host1'}
        ];
     
        const cpuUtilization = {
            'Dimensions': dimensions,
            'MeasureName': 'cpu_utilization',
            'MeasureValue': '13.5',
            'MeasureValueType': 'DOUBLE',
            'Time': currentTime.toString()
        };
     
        const memoryUtilization = {
            'Dimensions': dimensions,
            'MeasureName': 'memory_utilization',
            'MeasureValue': '40',
            'MeasureValueType': 'DOUBLE',
            'Time': currentTime.toString()
        };
     
        const records = [cpuUtilization, memoryUtilization];
     
        const params = {
            DatabaseName: constants.DATABASE_NAME,
            TableName: constants.TABLE_NAME,
            Records: records
        };
     
        const promise = writeClient.writeRecords(params).promise();
     
        return promise
    }
    

    
var handler = async function(event, context){
    console.log(writeClient)
    var res = await writeRecords()
    console.log(res)
    return false
}

handler({},{})
module.exports = {
    handler
}