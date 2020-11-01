var moment = require('moment')

const AWS = require("aws-sdk");
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
  });

var https = require('https');
var agent, writeClient
// queryClient = new AWS.TimestreamQuery();

function getBinarySize(string) {
  return Buffer.byteLength(string, 'utf8')/1024;
}

const writeRecords = async function (record) {
  console.log("Writing records");
  // const currentTime = Date.now().toString(); // Unix time in milliseconds

  const dimensions = [
      {'Name': 'TransactionId', 'Value': record.TransactionId},
      {'Name': 'Datapoint', 'Value': record.Type},
      {'Name': 'ObjectId', 'Value': record.ObjectId}
  ];

  const r = {
      'Dimensions': dimensions,
      'MeasureName': 'size_kb',
      'MeasureValue': getBinarySize(JSON.stringify(record)).toString(),
      'MeasureValueType': 'DOUBLE',
      // 'Time': (moment(record.dt)._d.getTime()+_.random(1000)).toString()
      'Time': (moment(record.ts)._d.getTime()).toString()
  };
  const records = [r];

  const params = {
      DatabaseName: process.env.DATABASE_NAME,
      TableName: process.env.TABLE_NAME,
      Records: records
  };

  const promise = writeClient.writeRecords(params).promise();

  return promise
}


const init = async function(){
  console.log('db',process.env.DATABASE_NAME)
  console.log('table',process.env.TABLE_NAME)
  if(!agent || ! writeClient){
    agent = new https.Agent({
      maxSockets: 5000
    });
    
    writeClient = new AWS.TimestreamWrite({
            maxRetries: 10,
            httpOptions: {
                timeout: 20000,
                agent: agent
            }
        });  

      
  }
}
const topic_handler = async (event, context) => {
    console.log("EVENT: ", JSON.stringify(event, null, 2));
    await init()

    var msgs = event.Records.map(r=>{
      return JSON.parse(JSON.parse(r.body).Message)
    })
    // console.log(msgs)
    console.log(msgs[0].Type) 
    var record = msgs[0]
    await writeRecords(record)
    return event
}

module.exports = {
    topic_handler,
}