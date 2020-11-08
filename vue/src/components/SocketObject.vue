<template>
<div>
</div>
</template>
 
<script>
// var api = require("../api");
import {EventBus} from '../EventBus'

export default {
  name: 'SocketObject', 
  props:[],
  data() {
    
    return {
            RecipientId:null,
            loading:true,
            socket:null,
            heartbeat:null,
            retry:false
          }
        },
  created: function(){
    // EventBus.$off('got_notified')
    // EventBus.$on("got_notified", (msg) => {
    //     this.check_notifications()
    //     // this.$dispatch("got_notified",msg);
    //   });
    EventBus.$on("socket_send", (msg) => {
      // console.log(msg)
        this.send_message(msg)
      });
      
  },
  mounted: function(){
    this.connect()
    // this.check_notifications()
  },
  destroyed: function(){
    clearInterval(this.heartbeat)
    
  },
  methods: {
    pause: (duration) => new Promise(res => setTimeout(res, duration)),
    // backoff: (retries, fn, delay = 200) =>
    //   fn().catch(err => retries > 1
    //   ? pause(delay).then(() => backoff(retries - 1, fn, delay * 2))
    //   : Promise.reject(err)),
    connect: async function(){
      if(this.retry){
        await this.pause(1000)
        if(this.socket && this.socket.readyState < 2){
          this.retry = false
          return false
        }
      }

      // this.RecipientId = this.get_user().id
      this.RecipientId = _.random(0,100)
      console.log(this.socket)
      this.socket = new WebSocket(this.$wss_api+"?user_id="+this.RecipientId);

      var self = this
      this.socket.onopen = function (event) {
        EventBus.$emit('socket_connected',event)
        self.retry = false
        self.socket_connected()
      }
      this.socket.onerror = async function  (event) {
        console.log('socket error, retrying '+self.error_retry, event)
        self.retry = true
        await self.connect()
      }
      this.socket.onclose = function (event) {
        EventBus.$emit('socket_disconnected',event)
        console.log('socket_disconnected', event)
        self.retry = true
        self.connect()
      }
    },
    socket_connected(){
      console.log('socket connected')
      var self = this;
      this.heartbeat = setInterval(self.send_heartbeat, 60000)
      this.socket.onmessage = function (event) {
        var msg = JSON.parse(event.data)
        EventBus.$emit('got_notified',msg)
      }
    },
    send_heartbeat:function(body){
      this.socket.send(JSON.stringify({
        message:"sendmessage",
        body: JSON.stringify({ts:Date.now()}),
        destination:{
          type:'heartbeat'
        }
      }))
    },
    send_message:function(body){
      console.log(this.socket.readyState)
      if(!this.socket || this.socket.readyState <1){
        return
      }
      // console.log(this.socket)
      this.socket.send(JSON.stringify({
        message:"sendmessage",
        body: typeof(body) == 'object' ? JSON.stringify(body) : body,
        "destination":{"type":"broadcast"}
      }))
    },
    check_notifications:function(){
    },
    open_notifications:function(){
      console.log('click')
    }
  }
}
</script>

<style scoped>
</style>
