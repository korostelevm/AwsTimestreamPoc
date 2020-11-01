var _ = require('lodash');

const axios = require("axios");
var jwksClient = require('jwks-rsa');
var jwt = require('jsonwebtoken');
var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var S3 = require('aws-sdk').S3;
var ssm = new AWS.SSM({ apiVersion: '2014-11-06' });
const path = require("path");
const fs = require("fs");
const logger = require("tracer").console({
  format: "<{{title}}> (in {{file}}:{{line}}) {{message}}",
  error:
    "<{{title}}> (in {{file}}:{{line}}) {{message}}\nCall Stack:\n{{stack}}", // error format
});



const get_ssm_param = function(param) {
    return new Promise((resolve, reject) => {
        var params = {
            Name: param,
            /* required */
        };
        ssm.getParameter(params, function(err, data) {
            if (err) reject(err)
            return resolve(data.Parameter.Value);
        });
    })
}

const axiosGet = (url, auth) => {
  const headers = {
    Authorization: auth,
  };

  return axios.get(url, { headers: headers }).catch(function (error) {
    console.log(error);
    return error.response;
  });
};

const axiosPost = (url, body, auth) => {
  const headers = {
    Authorization: auth,
  };

  return axios.post(url, body, { headers: headers }).catch(function (error) {
    console.log(error);
    return error;
  });
};

const buildQueryStringFromObject = function (queryObject) {
  let finalString = "";
  let queryKeys = Object.keys(queryObject);
  for (let i = 0; i < queryKeys.length; i++) {
    let key = queryKeys[i];
    let value = queryObject[key];
    let prefix = i == 0 ? "?" : "&";
    currentString = `${prefix}${key}=${value}`;
    finalString = finalString + currentString;
  }
  return finalString;
};

function ensureAuthenticated(req, res, next) {
  // insert random parameter
  // req.query[
  //   Math.random().toString(36).substring(2, 5) +
  //     Math.random().toString(36).substring(2, 5)
  // ] = true;
  logger.log(req.user)
  let queryString = buildQueryStringFromObject(req.query);
  logger.log(req.isAuthenticated())
  console.log('debug',process.env.DEBUG)
  if (req.isAuthenticated() || process.env.DEBUG) {
    return next();
  } else {
    return redirectWithParams(res, queryString, "/login");
  }
}

const redirectWithParams = function (res, queryString, path) {
  console.log("Redirecting to " + path + queryString);
  return res.redirect(path + queryString);
};

const logMessage = function (message, body) {
  try {
    logger.log(message, JSON.stringify(body));
  } catch (err) {
    logger.log(message, body);
  }
};



const remember = async function () {
  const [root_url,api_key] = await Promise.all([
    get_ssm_param('/account/root-url'),
    get_ssm_param('/account/internal-api-key')
  ]);

  console.log(api_key)
  return {
      write: async function(payload){
          return axios.post(`https://rememberv2.${root_url}/latest/write`, payload, {
              headers: {'Authorization': api_key},
            });
        },
      query: async function(payload){
          return axios.post(`https://rememberv2.${root_url}/latest/query`, payload, {
              headers: {'Authorization': api_key},
            });
        },
  }
}

const s3 = function (bucket) {
    var s3 = new S3({
        apiVersion: '2006-03-01'
    });

    return {
        read: async function read(key) {
            try{
                let file = await s3.getObject({Bucket:bucket,Key:key}).promise()
                return file.Body.toString('utf-8')    
            }catch(e){
                console.error(bucket, key)
                console.error(e)
                throw e
            }
            
        },
        put: async function put(key,data){
          var params = {
            Body: JSON.stringify(data), 
            Bucket: bucket, 
            Key: 'TxFailureFeed/'+key
           };
           return await s3.putObject(params).promise()
        },
        ls: function ls(path) {
            return new Promise((resolve, reject) => {
                var prefix = _.trimStart(_.trimEnd(path, '/') + '/', '/');
                var result = {
                    files: [],
                    folders: []
                };

                function s3ListCallback(error, data) {
                    if (error) {return resolve(error);}

                    result.files = result.files.concat(_.map(data.Contents, 'Key'));
                    result.folders = result.folders.concat(_.map(data.CommonPrefixes, 'Prefix'));

                    if (data.IsTruncated) {
                        s3.listObjectsV2({
                            Bucket: bucket,
                            MaxKeys: 2147483647, // Maximum allowed by S3 API
                            Delimiter: '/',
                            Prefix: prefix,
                            ContinuationToken: data.NextContinuationToken
                        }, s3ListCallback)
                    } else {
                        resolve(result);
                    }
                }
                s3.listObjectsV2({
                    Bucket: bucket,
                    MaxKeys: 2147483647, // Maximum allowed by S3 API
                    Delimiter: '/',
                    Prefix: prefix,
                    StartAfter: prefix // removes the folder name from the file listing
                }, s3ListCallback)
            })
        }
    }
};


const ensureDirectoryExistence = function (filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


const postRequest = async function(payload){
  return new Promise((resolve,reject) => {
    axios.post(payload.url,payload.body,{ headers: payload.headers})
    .then(data => {
      return resolve({data: data.data, statusCode: data.status})
    })
    .catch(error => {
      if(error.response){
        return resolve({data: error.response.data, statusCode: error.response.status})
      }else{
        return resolve({data: error.message, statusCode: 400})
      }
      
    })
  })
}

const getRequest = async function(payload){
  return new Promise((resolve,reject) => {
    axios.get(payload.url,{ headers: payload.headers})
    .then(data => {
      return resolve({data: data.data, statusCode: data.status})
    })
    .catch(error => {
      if(error.response){
        return resolve({data: error.response.data, statusCode: error.response.status})
      }else{
        return resolve({data: error.message, statusCode: 400})
      }
      
    })
  })
}


const getJwksUrl = async function(issuer){
  const openIdConfigurationUrl = issuer+'.well-known/openid-configuration'
  console.log("Open Id Configuration URL : "+openIdConfigurationUrl)
  const payload = {
    url : openIdConfigurationUrl
  }
  const openIdConfiguration = await getRequest(payload)
  const jwks_uri = openIdConfiguration.data.jwks_uri
  console.log("JWKS Url : "+jwks_uri)
  return jwks_uri
}


const getKey = async function(header,jwksUri){
    return new Promise((resolve,reject)=>{
      var client = jwksClient({
          jwksUri: jwksUri
      });
      client.getSigningKey(header.kid, function(err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        resolve(signingKey);
      });
    })
}

const verifyJWT = function(token,signingKey){
    return new Promise((resolve, reject)=>{
        jwt.verify(token,signingKey, function(err, decoded) {
          if(err){return resolve({effect:'Deny'})}
          return resolve({effect:'Allow'})
        })
  })
}

const decodeJWT = function(token){
    return jwt.decode(token, {complete: true});
}



module.exports = {
  s3,
  remember,
  ensureDirectoryExistence,
  axiosGet,
  axiosPost,
  buildQueryStringFromObject,
  ensureAuthenticated,
  redirectWithParams,
  logMessage,
  postRequest,
  getKey,
  verifyJWT,
  decodeJWT,
  getJwksUrl
};
