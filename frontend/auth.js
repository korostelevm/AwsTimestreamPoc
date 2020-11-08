
const utils = require('./utils')

let issuersList = [
  'https://aiva-internal.auth0.com/',
  'https://aiva-production.auth0.com/', 
  'https://heavywater-internal.auth0.com/', 
  'https://hw-poc.auth0.com/', 
  'https://portal-internal.us.auth0.com/',
  'https://portal-prod.us.auth0.com/'
]


const delegated_auth = function(token, event, url){
  return new Promise(async (resolve,reject)=>{
    const payload = {
      body: JSON.stringify(event),
      headers: {
        Authorization: token,
        'Content-Type':'application/json'
      },
      url: url
    }
    const validateAuth = await utils.postRequest(payload)
    if(validateAuth.statusCode==200)
      return resolve({effect:'Allow'})
    else
      return resolve({effect:'Deny'});
  })
}

const checkIssuers = async function(issuer){
    console.log(issuer)
  let additionalIssuers = process.env.Issuers
  ? process.env.Issuers.split(',')
  : []
  issuersList = issuersList.concat(additionalIssuers)
  console.log("Issuers List: "+issuersList)
  if(issuersList.includes(issuer))
    return true
  else 
    return false
}

const checkSessions =  async function(token){
  const SessionManagerUrl = process.env.SessionManagerUrl
  if(!SessionManagerUrl){
    return true
  }
  const payload = {
    body: JSON.stringify({access_token : token}),
    headers: {
      Authorization: process.env.ApiKey,
      'Content-Type':'application/json'
    },
    url: SessionManagerUrl
  }
  const validateSession = await utils.postRequest(payload)
  if(validateSession.statusCode==200)
    return true
  else
    return false
}

const jwt_auth = async function(token, event){
  console.log("Token : "+token)
  let decoded = utils.decodeJWT(token)
  
  if (!(decoded && await checkSessions(token))){
    console.log("Failed to decode or validate session")
    return new Promise((resolve)=>{return resolve({effect:'Deny'});})
  }
  const issuer = decoded.payload.iss.slice(-1)[0] == '/' ? decoded.payload.iss : decoded.payload.iss + '/'
  console.log("Issuer : "+issuer)
  console.log('jwt',JSON.stringify(decoded))
  if(!await checkIssuers(issuer)){
    console.log("Invalid Credentials")
    return new Promise((resolve)=>{ return resolve({effect:'Deny'}); })
  }
  const jwksUri = await utils.getJwksUrl(issuer)
  var signingKey =  await utils.getKey(decoded.header,jwksUri)
  return utils.verifyJWT(token,signingKey)
}

const basic_auth = function(token, event){
  return new Promise( (resolve,reject)=>{
    const [login, password] = Buffer.from(token, 'base64').toString().split(':')
    if(login == process.env.AivaBasicAuthLogin && password == process.env.AivaBasicAuthPassword){
      return resolve({effect:'Allow'});
    }else{
      return resolve({effect:'Deny'});
    }
  })
}

const token_auth = function(token, event){
  return new Promise((resolve,reject)=>{
    var ApiKey = process.env.ApiKey || process.env.InternalMicroservicesAPIKey
    if(token.startsWith(ApiKey)){
      return resolve({effect:'Allow'});
    }else{
      return resolve(jwt_auth(token, event));
    }
  })
}

const verify = async function(token) {
     var  validation_result = await jwt_auth(token)
      var effect = validation_result.effect

    if(effect == 'Allow' || process.env.DEBUG){
      return true
    }
    return false
}

module.exports = {
    verify,
}