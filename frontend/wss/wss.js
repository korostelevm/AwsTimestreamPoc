var AWS = require("aws-sdk");
AWS.config.update({ region:'us-east-1' });
var _ = require('lodash')
const ddb = new AWS.DynamoDB.DocumentClient({ 
  region:'us-east-1',
  apiVersion: '2012-08-10' });
let { TABLE_NAME, DOMAIN_NAME } = process.env;
if(!DOMAIN_NAME){
  DOMAIN_NAME = 'tx-status-wss.coldlambda.com'
  TABLE_NAME = 'TxStatusSocketConnections'
}
var apigwManagementApi  = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: DOMAIN_NAME,
  region:'us-east-1'
});

var local_ws
let last_checked = 0
let connections
const set_local_ws = function(app){
    var ws = require('express-ws')(app);
    app.ws('/', function(ws, req) { 
        ws.id = req.headers['sec-websocket-key']
        on_connect({
          queryStringParameters:req.query,
          requestContext:{
            connectionId:req.headers['sec-websocket-key']
          } 
        })
        ws.on('message', function(msg) { 
          handler({     
            queryStringParameters:req.query, 
            requestContext:{
              connectionId:req.headers['sec-websocket-key']
            }, 
            body:msg
          }) 
        }); 
        
        ws.on('close', function() {
          on_disconnect({
            queryStringParameters:req.query,
            requestContext:{
              connectionId:req.headers['sec-websocket-key']
            }
          })
        });
      });
      
  local_ws = ws
}
const post_to_connections_local = async function(connections, post_data){
  return new Promise(async (resolve,reject)=>{
    connections = connections.Items.map(({ connectionId }) => {return connectionId})
    var clients = Array.from(local_ws.getWss().clients)
    var client_ids = clients.map(c=>{return c.id})
    var stale_connections = []
    connections.forEach(c => {
      if(!client_ids.includes(c)){
        stale_connections.push(c)
      }
    });
    await Promise.all(stale_connections.map(c=>{
      return on_disconnect({
        requestContext: {connectionId:c}
      })
    })) 
    cleints = clients.filter(w=>{
      return connections.includes(w.id) && w.id != post_data.source
    });
    clients.map(w=>{
      w.send(JSON.stringify(post_data));
    });
    resolve('done')
  })
}



const post_to_connections =  async function(connections, post_data){

  if(!process.env.DOMAIN_NAME){
    return post_to_connections_local(connections, post_data)
  }
//   console.log(JSON.stringify(DOMAIN_NAME,null,2))
//   console.log(JSON.stringify(connections,null,2))
  connections.Items = connections.Items.filter((c)=>{
    return c.connectionId != post_data.source
  })
  const postCalls = connections.Items.map(async ({ connectionId }) => {
    try {
      await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(post_data) }).promise();

    } catch (e) {
    
      if (e.statusCode === 410) {
        console.log(`Found stale connection, disconnecting ${connectionId}`);
        await on_disconnect({
          requestContext: {connectionId}
        })
        // await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
      } else {
        throw e;
      }
    }
  });
//   console.log('posting to connections: ',postCalls.length)
  return Promise.all(postCalls);
}

const broadcast = async function(post_data){
  let connections = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  if(!connections.Items.length){
    return 
  }
  return post_to_connections(connections,post_data)
}

const send_to_user_connections = async function(user_id, post_data){
 connections = await ddb.query({
    TableName:TABLE_NAME, 
    IndexName:'UserIdIndex',
    KeyConditionExpression: 'UserId = :i',
    ExpressionAttributeValues: {
    ':i': user_id
    },
    ScanIndexForward:false,
    Limit: 1000,
  }).promise()
  return post_to_connections(connections, post_data)
}

const handler = async (event, context) => {
  var payload = JSON.parse(event.body);
  payload.source = event.requestContext.connectionId
  try {
    if (payload.destination.type == 'broadcast'){
      await broadcast(payload)
    }
    if(payload.destination.type == 'user'){
      await send_to_user_connections(payload.destination.user_id, payload)
    }
    if(payload.destination.type == 'heartbeat'){
      // do nothing, just keep connection open
    }
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'OK' };
};




const on_connect = async function (event, context) {
    console.log(event)
    
  var putParams = {
    TableName: TABLE_NAME,
    Item: {
      UserId: event.queryStringParameters.user_id,
      connectionId: event.requestContext.connectionId,
      ts: (new Date()).getTime()
    }
  };
  console.log(putParams)
  await ddb.put(putParams).promise();
  var item = {
    TableName: TABLE_NAME,
    Key: {
        connectionId: event.requestContext.connectionId,
    }
  };
  var connection = await ddb.get(item).promise()
  
//   await broadcast({
//     "event":"user_connected",
//     event_ts: (new Date()).getTime(),
//     ...connection.Item
//   })

  

  return { statusCode: 200, body: 'OK' };
};
 


const on_disconnect = async function (event, context) {
  
  var item = {
    TableName: TABLE_NAME,
    Key: {
        connectionId: event.requestContext.connectionId,
    }
  };

  var connection = await ddb.get(item).promise()

  await ddb.delete(item).promise();
  
//   var in_progress_tasks = await todo_db.get_in_progress({
//     Assignee: connection.Item.UserId
//   })  
//   console.log('in progerss',in_progress_tasks)
//   var update_requests = in_progress_tasks.map(t=>{
//     t['Assignee'] = null
//     t['Status'] = 'waiting'
//     return todo_db.update(t)
//   })
//   await Promise.all(update_requests)
//   // need to tell the service that this user has disconnected and put all their tasks back to waiting
  await broadcast({
    source:event.requestContext.connectionId,
    event:"user_disconnected",
    event_ts: (new Date()).getTime(),
    ...connection.Item
  })
  return { statusCode: 200, body: 'OK' };
};

module.exports = {
  broadcast,
  handler,
  on_connect,
  on_disconnect,
  set_local_ws,
  post_to_connections_local
}