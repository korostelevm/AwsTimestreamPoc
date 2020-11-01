# AwsTimestreamPoc
https://docs.aws.amazon.com/timestream/latest/developerguide/getting-started.node-js.sample-application.html

sample query repsonse 
```js
{
  QueryId: 'AEBQEAMX7LVHRSLTDP6QER2BQ34ITBHPOT2QPSKLJ5SP6NBAJOWZ6GQQC4XWAWA',
  Rows: [
    {
      Data: [
        { ScalarValue: 'Person' },
        { ScalarValue: '5f9ececac60e1e1b8e6740ff' },
        { ScalarValue: 'mike' },
        { ScalarValue: '0.275390625' },
        { ScalarValue: 'size_kb' },
        { ScalarValue: '2020-11-01 15:05:46.940000000' }
      ]
    },
    {
      Data: [
        { ScalarValue: 'Person' },
        { ScalarValue: '5f9ecaae8243c4ec2984de68' },
        { ScalarValue: 'mike' },
        { ScalarValue: '0.27734375' },
        { ScalarValue: 'size_kb' },
        { ScalarValue: '2020-11-01 14:48:14.019000000' }
      ]
    }
  ],
  ColumnInfo: [
    { Name: 'Datapoint', Type: { ScalarType: 'VARCHAR' } },
    { Name: 'ObjectId', Type: { ScalarType: 'VARCHAR' } },
    { Name: 'TransactionId', Type: { ScalarType: 'VARCHAR' } },
    { Name: 'measure_value::double', Type: { ScalarType: 'DOUBLE' } },
    { Name: 'measure_name', Type: { ScalarType: 'VARCHAR' } },
    { Name: 'time', Type: { ScalarType: 'TIMESTAMP' } }
  ]
}

```