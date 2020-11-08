process.env.DATABASE_NAME = 'TimestreamDbtimestream'
process.env.TABLE_NAME = 'TimestreamTabletimestream'
const util = require('util')
const moment = require('moment')
var fs = require('fs')
var _ = require('lodash')
var lambda = require('./query_handler').query_handler

var payload = {
};



(async ()=>{
 var res = await lambda(payload,{})

//  console.log(util.inspect(res, {showHidden: false, depth: null, colors:true}))

// res = res.filter(r=>{return r.TransactionId == '2b317a06-ca3e-462d-a83a-e88bb7639673'})
console.table(res)

var elapsed = 0
 res = res.map((r,idx)=>{
     r.ts = moment(r.time)._d.getTime()
     r.size_kb = +r.size_kb.toFixed(2)
     if(res[idx-1]){
         r.delta_t =  r.ts/1000 - res[idx-1].ts / 1000
         elapsed += r.delta_t
         r.elapsed = elapsed/60
         r.elapsed = +r.elapsed.toFixed(2)
         r.delta_t = +r.delta_t.toFixed(2)
        //  console.log(r.elapsed)
        //  console.log(r.delta_t)
     }else{
         r.delta_t = 0
         r.elapsed = 0
     }
     r.count = idx
     
     return r
 })

//  res = _.groupBy(res,'TransactionId')
// console.log(res)
// console.table(res)
fs.writeFileSync('tx.json',JSON.stringify(res))

})()