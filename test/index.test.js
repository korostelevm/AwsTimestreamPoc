var lambda = require('../service/index')
process.env.AWS_REGION = 'us-east-1'
describe("lambda", () => {
  test("test handler", async () => {

    lambda.handler({},{})
    // const res = remember.respond({ Key: "Value" }, 200);
    // expect(res).toEqual(expect.objectContaining({ statusCode: 200 }));
  });
});

