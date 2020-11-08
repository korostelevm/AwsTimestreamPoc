const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

const SSM = require("aws-sdk/clients/ssm");
const ssm = new SSM();
const port = process.env.PORT || 3000;

let keyToEnv = new Map();
keyToEnv.set("/idp/default/session-secret", "SESSION_SECRET");
keyToEnv.set("/idp/default/client-secret", "CLIENT_SECRET");
keyToEnv.set("/idp/default/authorization-url", "AUTHORIZATION_URL");
keyToEnv.set("/idp/default/client-id", "CLIENT_ID");
keyToEnv.set("/idp/default/token-url", "TOKEN_URL");
keyToEnv.set("/account/root-url", "RootUrl");
keyToEnv.set("/account/internal-api-key", "ApiKey");
keyToEnv.set("/account/app-bucket", "AppBucketName");

const params = {
  Names: [
    "/idp/default/session-secret:1",
    "/idp/default/client-secret:1",
    "/idp/default/authorization-url:1",
    "/idp/default/client-id:1",
    "/idp/default/token-url:1",
    "/account/root-url:1",
    "/account/internal-api-key:1",
    "/account/app-bucket:1",
  ],
  WithDecryption: true,
};

ssm.getParameters(params, function (err, data) {
  if (err) console.log(err, err.stack);
  else {
    data["Parameters"].forEach((entry) => {
      console.log(keyToEnv.get(entry.Name));
      process.env[keyToEnv.get(entry.Name)] = entry.Value;
    });
  }
  process.env.DEBUG = true;
  process.env.LOCAL = true;
  process.env.DATABASE_NAME = 'TimestreamDbtimestream'
  process.env.TABLE_NAME = 'TimestreamTabletimestream'
  const app = require("./frontend_express");
  app.listen(port);
  console.log(`listening on http://localhost:${port}`);
});
