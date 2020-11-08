var moment = require('moment')
var _ = require('lodash')

const AWS = require("aws-sdk");
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
  });


var https = require('https');
var agent = new https.Agent({
    maxSockets: 5000
});


var queryClient = new AWS.TimestreamQuery();
let getAllRows = async function (query, nextToken) { 
    const params = { 
        QueryString: query 
    }; 
    if (nextToken) {  params.NextToken = nextToken;  } 
    return await queryClient.query(params).promise() 
        .then( 
            (response) => { 
                if (response.NextToken) { 
                    return getAllRows(query, response.NextToken); 
                } else{
                    return response
                }
            }, 
            (err) => { 
                console.error("Error while querying:", err); 
            }); 
} 
var parse_results = function(results){
    var measure_name_key_idx = results.ColumnInfo.map(c=>{return c.Name.includes('measure_name')}).indexOf(true)
    var measure_value_key_idx= results.ColumnInfo.map(c=>{return c.Name.includes('measure_value')}).indexOf(true)
    var measure_type = results.ColumnInfo[measure_value_key_idx].Name.split(':').slice(-1)
    var res = results.Rows.map(r=>{
        
        var row = {}
        _.each(r.Data, (v,k)=>{
            var key = results.ColumnInfo[k].Name
            if(!key.includes('measure_')){
                row[key] = v.ScalarValue
            }
        })
        var measure_value = r.Data[measure_value_key_idx].ScalarValue
        var measure_key = r.Data[measure_name_key_idx].ScalarValue
        if(measure_type == 'double'  || measure_type == 'bigint'){
            measure_value  = +measure_value
        }
        if(measure_type == 'boolean'){
            measure_value  = (measure_value == 'true')
        }
        row[measure_key] = measure_value
        return row
    })
    return res
}

var run_query = async function(){
    var t0 = Date.now();
    // WHERE TransactionId like '390a931c-150d-4f42-aa12-9f842f2f04ba' 
    var qr = `
    SELECT * FROM "${process.env.DATABASE_NAME}"."${process.env.TABLE_NAME}" 
                WHERE time > ago(20m) 
                ORDER BY time ASC
                LIMIT 10
             `
    var res = await getAllRows(qr)
    var t1 = Date.now();
    console.log(`got ${res.Rows.length} rows, took ${t1 - t0} milliseconds`)
    return res
}

var received = async function(q){
    var qr = `
    SELECT * FROM "${process.env.DATABASE_NAME}"."${process.env.TABLE_NAME}" 
            WHERE time > ago(12h) 
            and Datapoint like 'TransactionReceived'
            ORDER BY time DESC 
             `
    var res = await getAllRows(qr)
    res = parse_results(res).map(r=>{
        r.Type = r.Datapoint
        r.ts = moment(r.time)._d.getTime()
        return r
    })
    res = res.map(r=>{return `TransactionId like '${r.TransactionId}'`})
    var datapoints = [
        '_skill_execution_arn',
        'TransactionReceived',
        '_paginated_ocr',
        'tifpaths',
        'AIVAExecution',
        'top_classification_page',
        '_documents_to_review',
        '_translation',
        '_extraction_output',
        '_classification_output',
        'FinalClassificationDocuments'
        ]
    datapoints = datapoints.map(d=>{return `Datapoint like '${d}'`})
    var qr = `
    SELECT * FROM "${process.env.DATABASE_NAME}"."${process.env.TABLE_NAME}" 
            WHERE (${res.join(' OR ')}) and (${datapoints.join(' OR ')})
            ORDER BY time DESC 
             `
    console.log(qr)
    var res = await getAllRows(qr)
    res = parse_results(res).map(r=>{
        r.Type = r.Datapoint
        r.ts = moment(r.time)._d.getTime()
        return r
    })
    return res
}
var query_handler = async function(event, context){
    var res = await run_query()
    res = parse_results(res)
    return res
}

module.exports = {
    query_handler,
    received
}