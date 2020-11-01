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
            console.log(key)
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
    var qr = `
                SELECT * FROM "${process.env.DATABASE_NAME}"."${process.env.TABLE_NAME}" 
                WHERE time > ago(2h) 
                ORDER BY time DESC
                LIMIT 10000
             `
    console.log(qr)
    var res = await getAllRows(qr)
    var t1 = Date.now();
    console.log(`got ${res.Rows.length} rows, took ${t1 - t0} milliseconds`)
    return res
}

var query_handler = async function(event, context){
    var res = await run_query()
    res = parse_results(res)
    return res
}

module.exports = {
    query_handler,
}