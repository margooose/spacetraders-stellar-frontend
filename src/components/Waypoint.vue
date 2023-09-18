<script>

import anime from 'animejs/lib/anime.es.js'

import { render, h, watch, toRaw } from 'vue'
import {callApi, apiCallCounter, delay} from '../App.vue'

import { useAppStore } from '../stores/appStore'
import { clickOutside } from '../directives/clickoutside'
import { mapState } from 'pinia'

export default {
    name: 'waypoint', //idk if this is needed

    directives: {
        clickOutside
    },

    computed: {
        ...mapState(useAppStore, ['shipIsSelected', 'clickedWaypoint', 'openedWaypoint', 'waypointInfoMenuIsSelected', 'selectedShip'])
    },

    props: {
        token: String,
        type: String,
        symbol: String,
        traits: Array,
        x_coordinate: Number,
        y_coordinate: Number,
        orbitals: Object,

        waypoint: Object,

        index: {type: Number, optional: true} //used to assign a postion to orbitals

    },

    data() {
        return {
            appStore: useAppStore(),

            hasMarket: false,
            hasShipyard: false,
            class: String,
            marker: String,
            isOutlined: false,
            orbitals_symbols: [],

            used_x_coordinate: Number,
            used_y_coordinate: Number,

            star_color: '',

            isOrbital: false,
            waypoint_is_opened: false,
        }
    },

    mounted() {
        //console.log('mounted, yee-haw!', this.waypoint)
        this.marker = this.symbol.slice(-6)

        for (const orbital of this.orbitals) {
            this.orbitals_symbols.push(orbital.symbol)
        }

        /* can't move farther than 40vw or 40vh */
        this.used_x_coordinate = this.x_coordinate / 2.86
        this.used_y_coordinate = this.y_coordinate / 2.86

        if (this.traits[1] === 'star') {
            this.star_color = this.traits[0]
            this.marker = this.symbol
            this.class = 'star'
        };

        if (this.type === 'MOON' || this.type === 'ORBITAL_STATION') { //defines three static posistions where orbitals will be placed
            this.isOrbital = true

            let orbital_slot_x = Number
            let orbital_slot_y = Number
            const em = window.innerWidth / parseFloat(getComputedStyle(document.querySelector('body'))['font-size'])

            switch(this.index) {
                case 0:
                    orbital_slot_x = em/4 * -1
                    orbital_slot_y = em/4 * -1
                break
                case 1:
                    orbital_slot_x = em/10
                    orbital_slot_y = em/2.5 * -1
                break
                case 2:
                    orbital_slot_x = em/3
                    orbital_slot_y = em/50
            }
            

            anime({
                targets: this.$refs[this.symbol],
                translateX: orbital_slot_x,
                translateY: orbital_slot_y,
            })
        }

        switch(this.type) {
            case 'PLANET':
                this.class = 'planet'
            break
            case 'GAS_GIANT':
                this.class = 'gas-giant'
            break
            case 'ASTEROID_FIELD':
                this.class = 'asteroid-field'
                //animate rotation?
            break
            case 'JUMP_GATE':
                this.class = 'jump-gate'
            break
            case 'MOON':
                this.class = 'moon'
            break
            case 'ORBITAL_STATION':
                this.class = 'orbital-station'
            break
        }
        for (const trait of this.traits) {
            if (trait.symbol === 'MARKETPLACE') {
                this.hasMarket = true
            }
            if (trait.symbol === 'SHIPYARD') {
                this.hasShipyard = true
            }
        }

        
    },

    watch: {
        'appStore.shipIsSelected'(newValue, oldValue) {
            if (newValue && !this.star_color) {
                this.$refs[this.symbol].style.borderStyle = 'dashed'
                this.isOutlined = true
            }
            if (!newValue) {
                this.$refs[this.symbol].style.borderStyle = 'none'
                this.isOutlined = false
            }
        }

    },


    methods: {
        selectWaypoint() {
            if (this.isOutlined === true && !toRaw(this.orbitals_symbols).includes(this.appStore.clickedWaypoint[0])) {
                this.appStore.clickedWaypoint = [this.symbol, this.x_coordinate, this.y_coordinate]
            }
        },


        openWaypointInfo() {

            if (this.appStore.selectedShip === false) {
                this.appStore.openedWaypoint = this.waypoint
            }
            

            this.waypoint_is_opened = true
        },

        closeWaypointInfo() {
            if (this.appStore.openedWaypoint != false && this.waypoint_is_opened && this.appStore.waypointInfoMenuIsSelected == false) {
                this.appStore.openedWaypoint = false

                this.waypoint_is_opened = false
            }
            
        }
    },


}

</script>


<template>
    <div :ref="symbol" @contextmenu.prevent v-clickOutside="closeWaypointInfo" :class="class" class="waypoint" @click="openWaypointInfo" @click.right="selectWaypoint" :style="{transform: `translate(${used_x_coordinate}vw, ${used_y_coordinate}vh)`, backgroundColor: star_color}">
        
        <div :ref="symbol + '-market'" v-if="hasMarket" class="market"></div>
        <div :ref="symbol + '-shipyard'" v-if="hasShipyard" class="shipyard"></div>
        
        <div class="waypoint-marker">{{marker}}</div>
        <div class="orbital-div" v-for="(item, index) in this.orbitals"  :key="index">
            <waypoint @click.stop :ref="item.symbol" v-bind="{
                token: this.token,
                type: item.type,
                symbol: item.symbol,
                traits: item.traits,
                x_coordinate: this.x_coordinate,
                y_coordinate: this.y_coordinate,
                orbitals: [],
                index: index,

                waypoint: item,
            }" />
        </div>
    </div>        

</template>

<style>
.waypoint{
    aspect-ratio: 1/1;
    border-radius: 50%;
    background-color: beige;
    display: flex;
    align-items: center;
    color: white;
    border-color: #7effe1;

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;

    max-width: max-content;
    font-size: calc(1em * .7);

    background-size: cover;

    z-index: .9;
}
.waypoint-marker{
    position: relative;
    top: 70%;
    z-index: 0;
}



.market{
    background-image: url(../assets/16x_market_icon.png);
    background-size: cover;
    min-width: 40%;
    min-height: 40%;
    z-index: 4;

    transform: translate(0%, 50%);
}
.shipyard{
    background-image: url(../assets/16x_shipyard_icon.png);
    background-size: cover;

    min-width: 40%;
    min-height: 40%;
    z-index: 4;

    transform: translate(50%, 50%);
}

.star{
    font-size: calc(1em * 1.25);
}

.planet{
    background-image: url(../assets/64x_habitable_planet.jpg);
}
.jump-gate{
    border-radius: 0%;
    font-size: calc(1em *.4);
    background-image: url(../assets/16x_jump_gate.png)
}
.gas-giant{
    font-size: calc(1em * .9);
    background-image: url(../assets/32x_gas_giant.png)
}
.asteroid-field{
    background-image: url(../assets/32x_asteroid_field.png);
}

.moon{
    font-size: calc(1em *.7);
    background-image: url(../assets/16x_colonized_moon.jpg)
}
.orbital-station{
    font-size: calc(1em *.7);
    background-image: url(../assets/16x_orbital_station.jpg);
}
</style>