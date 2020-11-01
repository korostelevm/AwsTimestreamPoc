// http://raaviblog.com/how-to-stream-data-from-amazon-dynamodb-to-amazon-s3-using-aws-lambda-and-amazon-kinesis-firehose-and-analyse-using-microsoft-power-bi/

const csv = require('csv-parser');
var faker = require('faker');
const fs = require('fs');
const _ = require('lodash');
const write = require('./db').write;
const delay = ms => new Promise(res => setTimeout(res, ms));
// 17d3459c-536d-4576-be1b-00ed0b2f75d7
const utils = require('./utils')
function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
  }
  return str.join(' ');
}
// var rows = []

var tx = JSON.parse(fs.readFileSync('tx.json'))
console.log(tx.length)
var run = async function () {
    for ( var i=0; i<10000;i++){
      // var w = _.chunk(tx, 10).map((chunk) => {
        // var dps = chunk.map(c => {
        for ( c of tx){
          console.log(i, c)
          var res = await write([{
            Type: c.Type,
            TransactionId: 'aaa_'+i,
            Fields: c.Fields,
            Attributes: c.Attributes
          }])
          await delay(200);
          console.log('res',res)
        }
      }
      // console.log('done' + i)
    // }
    // console.log('done')
};


(async ()=>{
  var remember = await utils.remember();
  var payload = [{
            Type: 'Person',
            TransactionId: 'mike',
            Fields:{
              Name: faker.name.firstName()
            },
            Attributes:{
            }
        }];
  try{
      var res = await remember.write(payload)
      console.log(res.data)
    }catch(e){
      console.log(e)
    }

  try{
      var res = await remember.query({
        TransactionId: 'mike'
      })
      console.log(res.data.Results)
    }catch(e){
      console.log(e)
    }
    // remember.query
})()

// fs.createReadStream('300.csv')
//   .pipe(csv())
//   .on('data', (row) => {
//     row.pk = row.CUSTOMER
//     row.Type = titleCase(row.DOCUMENT).replace(/ /g, "");
//     rows.push(row)
//     // console.log(row)
//   })
//   .on('end', async () => {
//     console.log('done')    
    
//     _.range(0,1000).forEach(async d=>{

//       var fields = {}
//       _.range(0,_.random(1,5)).map( i=>{
//         fields[faker.commerce.productMaterial()] = faker.finance.accountName()
//         fields[faker.company.catchPhraseAdjective()] = faker.company.catchPhrase()
//       })
//       var res = await write([{
//         Type: faker.name.firstName(),
//         TransactionId: null,
//         Fields:fields,
//         Attributes:{
//         }
//       }])
//       console.log(fields)
//     })
//   //   var res = await write(rows.map(r=>{
//   //     var type = r.DOCUMENT
//   //     delete r.Type
//   //     return {
//   //     Type: r.DOCUMENT,
//   //     TransactionId: null,
//   //     Fields:r,
//   //     Attributes:{
//   //     }
//   //   }
//   // }))

//   });