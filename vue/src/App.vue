<template>
  <div class='main' style="">
    <SocketObject/>
    <div
     v-for="(t,tx_id) in txs"
     :key="tx_id"
    >
    {{t.dt}} | {{tx_id}}
      <div>
          <b-list-group horizontal style='color:black'>
            <b-list-group-item
                v-for="d of t.datapoints"
                    :key="d.ObjectId"
                    >
            {{type_mappings[d.Type]}} <small>{{d.dt}}</small>
             </b-list-group-item>
          </b-list-group>
      </div>
    </div>
  </div>

</template>
 
<script>
var moment = require('moment-timezone')
import { EventBus } from './EventBus.js';
export default {
    name: 'microfrontend',
    data() {
      return {
        type_mappings:{
          'TransactionReceived' : "Received Transaction",
          '_skill_execution_arn' : "Skill Started",
          'tifpaths' : "Convert Complete",
          '_paginated_ocr' : "Ocr Complete",
          'top_classification_page' : "Comprehend Classification Complete",
          'AIVAExecution' : "File in Review",
          'FinalClassificationDocuments' : "Classification Review Complete",
          '_translation' : "Review Complete",
          '_extraction_output' : "Extraction Sent to Customer",
          '_classification_output' : "Classification Sent to Customer",
        },
        messages:[],
        hours:6,
        error: false,
        active: 'artifacts',
        loading: false,
      }
    },
    computed: {
      txs:  function () {
        // `this` points to the vm instance
        var by_tx = _.groupBy(this.messages,'TransactionId')
        
        _.each(by_tx,(v,t)=>{
          var tx = v.filter(d=>{return d.Type == 'TransactionReceived'})[0]
          var datapoints = _.uniqBy( _.sortBy(v, d=>{return d.ts}).reverse(),d=>{
              return d.Type}).reverse()
          by_tx[t] = {
             ...tx,
            datapoints: datapoints
          }
        })
        return by_tx
      }
    },
    mounted: function() {
      EventBus.$on('got_notified',(m)=>{
        console.log(m)
        if(m.body){
          m = JSON.parse(m.body)
          m.dt = moment.tz(moment.utc(m.ts).format(),moment.tz.guess()).format('L h:mm:ss a z')
          this.messages.push(m)
        }
      })
      this.load_tx()
    },
    created: function() {
    },
    methods: {
      load_tx: async function(){
        return new Promise((resolve,reject)=>{
          fetch(this.$api + '/tx?hours='+this.hours, {
              method: 'GET',
                withCredentials: true,
                credentials: 'include',
              // referrer:"",
              headers: {
                // 'Content-Type': 'application/json',
                // 'Access-Control-Expose-Headers': '*'
                'Authorization': this.get_auth_header()
              },
            })
            .then(res => res.json()) 
            .then(data => {
              data = data.map(d=>{
                // d.dt = moment(d.ts).format('L h:mm:ss a z')
                d.dt = moment.tz(d.ts,moment.tz.guess()).format('L h:mm:ss a z')
                return d
              })
              this.messages = data
              console.log(data)
            })
        })
      },
      navto: function(t){
        console.log(t)
        this.active=t
      }
    },
  }
</script>

<style >
body {
  background-color: #454d55 !important;
}
.nav-tabs .nav-link {
    border: 1px solid transparent;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    color: white;
}
.main{
  color: white;
}
</style>
