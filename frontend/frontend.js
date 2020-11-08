"use strict";
const awsServerlessExpress = require("aws-serverless-express");
const app = require("./frontend_express");

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below, then redeploy (`npm run package-deploy`)
const binaryMimeTypes = [
  "application/javascript",
  "application/octet-stream", 
  "application/json",
  "application/xml",
  "font/eot",
  "font/opentype",
  "font/otf",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "text/comma-separated-values",
  "text/css",
  "text/html",
  "text/javascript",
  "text/plain",
  "text/text",
  "text/xml",
];
const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

exports.handler = (event, context) => {
  console.log("request", JSON.stringify(event));
  if(event.version == '2.0'){
    event.path = event.rawPath
    event.httpMethod = event.requestContext.http.method
  }
  
  var res = awsServerlessExpress.proxy(server, event, context);
  try {
    console.log("response", JSON.stringify(res));
  } catch (e) {
    console.log(e);
    console.log(res);
  }
  return res;
};
