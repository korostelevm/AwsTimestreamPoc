process.env.DATABASE_NAME = 'TimestreamDbtimestream'
process.env.TABLE_NAME = 'TimestreamTabletimestream'

var lambda = require('./topic_handler').topic_handler

var payload = {
    "Records": [
        {
            "messageId": "e23d38ef-a469-4774-96a3-f92e58c0f871",
            "receiptHandle": "AQEBodatwKRX+l9LGF38cnEudIpP8b5JSwPeGenvxc7Rk6+iHNkWgwqG+LlzCnMc+cg0cwGp6qK2t+4CQZlGhNrXoxi5lnhqdiByuA7plFx7lHzPrTkkqeBg4UwCm6Rvdtn0coHAta89M9WPqjNxOMv/kqdI5ZdmY9x6qpf2FcypBfDQCvInBPc4LtjJPSBZzAjeidDiLaESDY+uNo0hIAIzbD7Q2bxFo3bszlCU1HatfFwGhPiDkzBFlIKTiTHhmr/Hz82AhULn9EaIiAthoqdUt5/m/BaXSF5CTdAfVf4XPDyYHAzm/66R5UZEbAjWO3Fa/Oyft81c0kTpA598WQcfhB+PsUoRNm+7TninTpJkSusnOLstptMhGjXXQa0FZkhg8cAO+RB7wrnsc8S6AnXF5YWqMdfcY5FQ4b08Oa509vFjIxel/jBR4MTCFzLpHHGe",
            "body": "{\n  \"Type\" : \"Notification\",\n  \"MessageId\" : \"3337c414-c25a-5599-a255-9c0c713d34dc\",\n  \"TopicArn\" : \"arn:aws:sns:us-east-1:301735071762:DatapointStream\",\n  \"Message\" : \"{\\\"IndexId\\\":\\\"5f9eb126b8727db849f0b177\\\",\\\"TransactionId\\\":\\\"06387e83-08f9-48b2-89f2-28f23553d035\\\",\\\"ObjectId\\\":\\\"5f9eb126a5e3aa9327a82e2b\\\",\\\"ts\\\":1604235558356,\\\"ttl\\\":1761915558,\\\"QueryIndex\\\":\\\"TransactionId::06387e83-08f9-48b2-89f2-28f23553d035\\\",\\\"Attributes\\\":{\\\"TransactionFlowConfig::TransactionId\\\":\\\"06387e83-08f9-48b2-89f2-28f23553d035\\\",\\\"TransactionId\\\":\\\"06387e83-08f9-48b2-89f2-28f23553d035\\\"},\\\"Fields\\\":{\\\"_translation_type\\\":\\\"adapter\\\",\\\"enable_translate\\\":\\\"false\\\",\\\"simulation\\\":\\\"false\\\",\\\"_translate_enabled\\\":\\\"false\\\",\\\"account_owner\\\":\\\"CALIBER\\\",\\\"translation_type\\\":\\\"adapter\\\",\\\"enable_review\\\":\\\"true\\\",\\\"adapter_url\\\":\\\"\\\",\\\"enable_review_extraction\\\":\\\"true\\\"},\\\"Type\\\":\\\"TransactionFlowConfig\\\"}\",\n  \"Timestamp\" : \"2020-11-01T12:59:19.285Z\",\n  \"SignatureVersion\" : \"1\",\n  \"Signature\" : \"pUzqfwJf+aQcS9H/hAC+CkucyGfju1CNxuF2QiN5EIQp3n4a49JRIC15c4emXHs63vpfljGY7Ohg8qC1eB7Qu+R9qz8ZYg0fF3mvULP5l3vLkPtxP5z3QTvE2acn3StA0A6ip3cRYqBhHepUJhs/1W9sAhHSsc3SZbjt0PWkWvuwtDO9zOa/swnYFY1JU2Zj2Lv6PNcPz5yHxTWtIyZcq4wwIF/RVPn3lZSxdHN2/eLhx9NI5fPQuRSjvmZMscvHxqmHzu7Oo0fd+VusZx8qhbqjq7FumlL7FBPkO93Wm8YDZZ11el6BZudEuqVwZCF/moZp6h6QQ3krInfv+iYVow==\",\n  \"SigningCertURL\" : \"https://sns.us-east-1.amazonaws.com/SimpleNotificationService-a86cb10b4e1f29c941702d737128f7b6.pem\",\n  \"UnsubscribeURL\" : \"https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:301735071762:DatapointStream:d70fc42a-a8b0-4b43-b65c-1083e86768b7\",\n  \"MessageAttributes\" : {\n    \"datapoint_type\" : {\"Type\":\"String\",\"Value\":\"TransactionFlowConfig\"}\n  }\n}",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1604235559348",
                "SenderId": "AIDAIT2UOQQY3AUEKVGXU",
                "ApproximateFirstReceiveTimestamp": "1604235559359"
            },
            "messageAttributes": {},
            "md5OfBody": "83fca7bd4e0649772a61ced095bfcbe5",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:301735071762:reports-poc-TopicLambdaTopicEventQueue-1A07V6J8IFA04",
            "awsRegion": "us-east-1"
        }
    ]
};


(async ()=>{
 var res = await lambda(payload,{})
 console.log(res)
})()