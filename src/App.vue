<style>
@import url('https://fonts.googleapis.com/css2?family=Ysabeau+SC&display=swap');

@font-face {
  font-family: DUNE;
  src: url(assets/dune_rise/Dune_Rise.ttf);
}
* {
  /*font-family: DUNE;   its a bit much*/
  font-family: 'Ysabeau SC', sans-serif;
}
.DUNE{
  font-family: DUNE;
}

body {
  background-color: #818380;
  margin-top: 0;
  margin-left: 0;
}

#right {
    flex:8;

    display: flex;
    flex-direction: column;
}
#map-div {
  flex: 3;
}
#supplementary-info-div{
  flex: 1;
  max-height: 25vh;

  display: flex;
  flex-direction: column;
}


#left {
    flex: 2;
    display:flex;
    flex-direction: column;
}
.button{
  text-align: center;
  max-width: fit-content;
  padding: .25em 1em;
  cursor: pointer;
}
.money-text{
  color: yellow;
  background-color: inherit;
  font-weight: bolder;
}
.power-text{
  color: darkgoldenrod;
  background-color: inherit;
  font-weight: bold;
}
.crew-text{
  color: #902bf5;
  background-color: inherit;
  font-weight: bold;
}
.slots-text{
  color: red;
  background-color: inherit;
  font-weight: bolder;
}
.stats-text{
  color:fuchsia;
  background-color: inherit;
  font-weight: bolder;
}
.tooltip-anchor{
  background-color: inherit;
  font-weight: bolder;
  cursor: default;
  color: blue;

  position: relative;
}
.tooltip-anchor:hover + .tooltip-text{
  visibility: visible;
  z-index: 5;
  padding-left: .25em;
}

.tooltip-text{
  visibility: hidden;
  
  background-color: #a2a5a1;
  position: absolute;
  bottom: 100%;
  border-radius: 5%;
}
#main-info {
    flex:10;
    margin-left: .5em;
    max-width: 19vw;
    max-height: 10vh;
}
#ship-div {
    flex:90;
}


#login-screen-container{
  width: 100vw;
  
  background: linear-gradient(0deg, #2a6e62 0, #08ffbd 45% 60%, #2a6e62 100%);
  display:flex;
  flex-direction: row;
  
}
#login-screen-inner-container{
  flex:1;
  display: flex;
  flex-direction: column;
}
#login-screen{
  flex:1;

  display: flex;
  flex-direction: row;
  color: #486694;
  font-weight: bolder;
  font-size: larger;
}
#sign-up-screen{
  flex:1;
}
.token-input{
  border-radius: 1em;
  padding: 2em;
  border: solid #7ed2ff .5em;
  background-color: #7effe1;
}
.enter-signup-button{
  border-radius: 1em;
  padding: .25em;
  margin-top: .25em;
  border: solid #7ed2ff .25em;
  background-color: #7effe1;
  max-width: fit-content;
  cursor: pointer;
}
#signup-details{
  margin-top: .25em;
  background-color: #2a6e62;
  color: #7effe1;
  overflow: scroll;
  padding-left: .1em;
  max-width: 10em;
}
.signUpDebug{
  position: relative;
    text-align: center;
    margin-top: .5rem;
    padding: .5rem;
    background-color: #6e2a36;
    border: .5rem solid #ff084a;
    color: #ff084a;
    font-weight: bolder;
    font-size: larger;
}




</style>



<script>
import Ship from './components/Ship.vue'
import System from './components/System.vue';
import Waypoint from './components/Waypoint.vue'
import WaypointDataScreen from './components/WaypointDataScreen.vue';
//import components here

import {h, render} from 'vue';
import { useAppStore } from './stores/appStore'
import { mapState } from 'pinia';



// code for making the api calls in an centralized system
export let apiCallCounter = [];
// idk if i need to let these both be exported but idk if it'll work without the export
export function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}


export async function callApi(apiURL, apiRequestOptions) {
  apiCallCounter.push('request_for_usage');
  await delay((apiCallCounter.length - 1) * 500);
  const http_response = await fetch(apiURL, apiRequestOptions);
  const json_data = await http_response.json();
  apiCallCounter.shift();
  return json_data;
};

export default {
  components: {
    Ship,
    Waypoint,
    System,
    WaypointDataScreen,
  },

  computed: {
    ...mapState(useAppStore, ['rerenderShips']),

    signUpDetailsIcon() {
      return this.showSignUpDetails ? '▼' : '▶'
    },
  },

  data() {
    return {
      appStore: useAppStore(),

      loggedIn: false,
      loginDebug: false,
      showSignUpDetails: false,
      showSignUpDetailsContainer: false,
      showSignUpButton: true,
      sign_up: false,
      signup_debug: false,
      signup_token: String,
      token: String,
      

      command_ship_location: Object,
      credits: 0,
      ships: '',
      options: '',
    
    }
  },

  watch: {
    async 'appStore.rerenderShips'(newValue, oldValue) {
      if (newValue) {
        await this.InstantiateShips();
        console.log('ships reloaded')
        this.appStore.rerenderShips = false
      }
    }
  },


  methods: {

    async SignUp() {
      const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: `{"faction":"COSMIC","symbol":"${this.$refs['SignUpInputRef'].value}"}`
      };

      this.sign_up = await callApi('https://api.spacetraders.io/v2/register', options)

      if (Object.hasOwn(this.sign_up, 'error')) {
        this.signup_debug = this.sign_up.error.message

      } else {
        this.signup_debug = false

        this.showSignUpButton = false
        this.showSignUpDetailsContainer = true
        this.signup_token = this.sign_up.data.token
      }
    },

    

    async TokenInput() { //idk if the token_id part does anything    
    
    this.token = this.$refs['TokenInputRef'].value;
    

    this.options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ('Bearer ' + this.token)
      },
    };

    const agent_info = await callApi('https://api.spacetraders.io/v2/my/agent', this.options)
    if (Object.hasOwn(agent_info, 'error')) {
      this.loginDebug = agent_info.error.message
    } else {
      this.loggedDebug = false

    this.loggedIn = true

    

    this.credits = agent_info.data.credits

    const ships = await callApi('https://api.spacetraders.io/v2/my/ships', this.options);
    this.ships = ships.data

    this.initial_location = ships.data[0].nav

    await this.InstantiateMap()

    await this.InstantiateShips()
    }},

    async InstantiateMap() {
      const location = await callApi(`https://api.spacetraders.io/v2/systems/${this.initial_location.systemSymbol}?limit=20`, this.options); 
      
      render(
        h(System, {token: this.token, initial_location: location}),
        this.$refs['map-div'],
      )

    },

    async InstantiateShips() {

      let ship_h_list = []

      for (const specific_ship in this.ships) {
        ship_h_list.push(
          h(Ship, {token: this.token, symbol: this.ships[specific_ship].symbol, prop_ship: this.ships[specific_ship]})
      )};

      render(
        h('div', ship_h_list),
        this.$refs['ship-div'],
      )

    },

  },




}



</script>



<template>
<!--html here-->

<div v-if="loggedIn" id="left">

  <div id="main-info">
    <div class="money-text">Credits: ₹{{ credits }}</div>
    <div @click="showSignUpDetails = !showSignUpDetails" style="cursor: pointer;" class="crew-text">{{ signUpDetailsIcon }}Token</div>
    <div style="overflow: hidden;" v-if="showSignUpDetails">{{ token }}</div>
  </div>
  <div id="ship-div" ref="ship-div">

  </div>
</div>

<div v-if="loggedIn" id="right">
  <div id="map-div" ref="map-div">

  </div>
  
  <div id="supplementary-info-div">
    <WaypointDataScreen />
  </div>
</div>
<div v-if="!loggedIn" id="login-screen-container">
  <div style="flex:1;"></div>
  <div id="login-screen-inner-container">
    <div style="flex:2;"></div>
    <div id="login-screen">
      <div style="flex:1;">
        <div class="DUNE">login</div>
        <input ref="TokenInputRef" @keyup.enter="TokenInput()" class="token-input" placeholder="Paste Your Token Here">
        <div @click="TokenInput()" class="enter-signup-button">Enter</div>
        <div v-if="loginDebug" class="signUpDebug">
          {{ loginDebug }}
        </div>
      </div>
      <div style="flex:1;">
        <div class="DUNE">sign up</div>
        <input ref="SignUpInputRef" @keyup.enter="SignUp()" class="token-input" placeholder="Enter Username Here">
        <div @click="SignUp()" v-if="showSignUpButton" class="enter-signup-button">Enter</div>
        <div v-if="showSignUpDetailsContainer">
          <div>*Copy your token - it is the only way to access your account</div>
          <div @click="showSignUpDetails = !showSignUpDetails" style="cursor: pointer;">{{ signUpDetailsIcon }}Account Token</div>
          
          <div id="signup-details" v-if="showSignUpDetails" ref="signup_token_output">{{ signup_token }}</div>
        </div>
        <div v-if="signup_debug" class="signUpDebug">
          {{ signup_debug }}
        </div>
      </div>
    </div>
    <div style="flex:2"></div>
  </div>
  <div style="flex:1;"></div>

  
</div>

</template>

