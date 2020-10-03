const csv = require('csv-parser');
const fs = require('fs')
const path = require('path')
var lambda = require('../service/index')
var _ = require('lodash')
var populate = async function(){
    return new Promise((resolve,reject)=>{
        fs.createReadStream(path.join(__dirname, 'trains.csv'))
        .pipe(csv())
        .on('data', async (row) => {
            // row.pk = row.CUSTOMER
            // row.Type = titleCase(row.DOCUMENT).replace(/ /g, "");
            // rows.push(row)
            console.log(row)
            row.duration = parseFloat(row.duration).toFixed(3).toString()
            try{
                
                var res = await Promise.all(_.range(0,100).map(async i=>{
                    return lambda.writeRecords(row);
                }))

                console.log(res)
                return res
            }catch(e){
                console.log('error',e)
                console.log('error',row)
            }
        })
        .on('end', async () => {
            resolve('done')
        });
    })
}

(async function() {
   
    let res = await populate;
    console.log(res);
}());