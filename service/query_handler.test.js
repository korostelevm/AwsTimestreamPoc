process.env.DATABASE_NAME = 'TimestreamDbtimestream'
process.env.TABLE_NAME = 'TimestreamTabletimestream'
const util = require('util')


var lambda = require('./query_handler').query_handler

var payload = {
};


(async ()=>{
 var res = await lambda(payload,{})
 console.log(util.inspect(res, {showHidden: false, depth: null, colors:true}))
 

})()