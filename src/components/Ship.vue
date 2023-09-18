<style>
.ship-object-container{
    background-color: #7effe1;
    display: flex;
    flex-direction: column;
    padding: .5em;

    border-style: solid;
    border-width: .5em;
    border-color: #01ffc4;

    margin: .3em;
    margin-right: 1em;

    /*box-shadow: .3em 0em #2bff01;*/


}

.ship-top{
    font-family: DUNE;
    font-size: large;

    display: flex;
    flex-direction: row;
    margin-bottom: .5em;
}

.ship-frame-info{
    display: flex;
    flex-direction: row;
    margin-bottom: .5em;
}
.ship-frame-value{
    flex:1
}

.ship-location-info{
    display: flex;
    flex-direction: row;
}
.ship-status-div{
    font-weight: bolder;
}


.ship-map-symbol-container{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;

    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    width: 100%;

    visibility: hidden;
}
.ship-map-symbol{
    position: absolute;

    background-image: url('../assets/16x24_player_ship.png');
    background-size: cover;

    font-size: calc(1em * .8);

    min-width: 1em;
    min-height: 1.5em;

    visibility: visible;
    color: white;

    z-index: 1;
}



</style>

<script>
import anime from 'animejs/lib/anime.es.js'
import { mapState } from 'pinia'
import { toRaw } from 'vue'

import AppVue, {callApi, apiCallCounter, delay} from '../App.vue'
import { clickOutside } from '../directives/clickoutside'

import { useAppStore } from '../stores/appStore'

export default {
    directives: {
        clickOutside
    },

    props: {
        token: String,
        symbol: String,
        prop_ship: Object,
    },

    data() {
        return {
            appStore: useAppStore(),

            ship: Object,

            shipIsInSystem: false,

            isDocked: false,
            isSelected: false,
            debug_is_toggled: false,
            has_movement_error: false,

            ship_flags: '',

            ship_destinations: ['<right click any waypoint>'],

            one_vw_in_px: Number,
            one_vh_in_px: Number,
            em: Number,
            raw_rendered_orbitals: Array,
            orbital_x_distortion: 0,
            destination_orbital_x_distortion: 0,
            orbital_y_distortion: 0,
            destination_orbital_y_distortion: 0,
            time_till: Number,

            ship_debug_object: Object,
        }
    },

    created() {
        this.ship = this.prop_ship
    },

    async mounted() {

        if (this.ship.nav.systemSymbol === this.appStore.renderedSystem) {
            this.shipIsInSystem = true
        }

        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ('Bearer ' + this.token)
            },
        };


        console.log(this.ship)
        

        if (this.ship.nav.status === 'DOCKED') { // a boolean is needed to change the color
            this.isDocked = true
        }

        this.ship_flags = '.3em 0em #2bff01'
        


        this.one_vh_in_px = document.getElementsByTagName('html')[0].clientHeight / 100
        this.one_vw_in_px = document.getElementsByTagName('html')[0].clientWidth / 100

        const current_time = new Date().getTime()                   //turns everything into ms
        const dep_time = new Date(this.ship.nav.route.departureTime).getTime()
        const arrv_time = new Date(this.ship.nav.route.arrival).getTime()
        const transit_time = arrv_time - dep_time
        const time_passed = current_time - dep_time
        this.time_till = arrv_time - current_time
        const route_progress = (time_passed / transit_time)  

        this.em = window.innerWidth / parseFloat(getComputedStyle(document.querySelector('body'))['font-size'])

        this.raw_rendered_orbitals = toRaw(this.appStore.renderedSystemOrbitals)//setting location for when at moon
        for (const orbital_array of this.raw_rendered_orbitals) {
            for (const orbital of orbital_array) {
                if (orbital == this.ship.nav.waypointSymbol) {
                    switch(orbital_array.indexOf(orbital)) {
                        case 0:
                            this.orbital_x_distortion = this.em/4 * -1
                        break
                        case 1:
                            this.orbital_x_distortion = this.em/10
                        break
                        case 2:
                            this.orbital_x_distortion = this.em/3
                        break
                    }
                    switch(orbital_array.indexOf(orbital)) {
                        case 0:
                            this.orbital_y_distortion = this.em/4 * -1
                        break
                        case 1:
                            this.orbital_y_distortion = this.em/2.86 * -1
                        break
                        case 2:
                            this.orbital_y_distortion = this.em/50
                        break
                    }
                }
            }
        }

        if (current_time >= arrv_time) { //if ship is stationary 
            anime({
                targets: this.$refs[this.symbol],
                translateX: (this.ship.nav.route.destination.x / 2.86 * this.one_vw_in_px) + (this.one_vw_in_px * 10) + (this.one_vw_in_px * .2) + this.orbital_x_distortion,
                translateY: (this.ship.nav.route.destination.y / 2.86 * this.one_vh_in_px) - (this.one_vh_in_px * 10) - (this.one_vh_in_px * 4) + this.orbital_y_distortion,
                easing: 'steps(1)',
            })
        } else { //if ship is moving between points
            
            console.log('the route progress: ' + route_progress + '% complete with ' + this.time_till / 1000 + 's to go')

            const drifting_point_x = this.ship.nav.route.departure.x + route_progress * (this.ship.nav.route.destination.x - this.ship.nav.route.departure.x)
            const drifting_point_y = this.ship.nav.route.departure.y + route_progress * (this.ship.nav.route.destination.y - this.ship.nav.route.departure.y)

            anime({
                targets: this.$refs[this.symbol],
                translateX: [
                    {value: (drifting_point_x / 2.86 * this.one_vw_in_px) + (this.one_vw_in_px * 10) + (this.one_vw_in_px * .2), duration: 1, delay: 0},
                    {value: (this.ship.nav.route.destination.x / 2.86 * this.one_vw_in_px) + (this.one_vw_in_px * 10) + (this.one_vw_in_px * .2) + this.orbital_x_distortion, duration: this.time_till, delay:1, easing: 'linear'}
                ],
                translateY: [
                    {value: (drifting_point_y / 2.86 * this.one_vh_in_px) - (this.one_vh_in_px * 10) - (this.one_vh_in_px * 4), duration: 1, delay: 0},
                    {value: (this.ship.nav.route.destination.y / 2.86 * this.one_vh_in_px) - (this.one_vh_in_px * 10) - (this.one_vh_in_px * 4) + this.orbital_y_distortion, duration: this.time_till, delay:1, easing: 'linear'}
                ]
            })

            await delay(this.time_till)

        }



    },

    computed: {
        ...mapState(useAppStore, ['shipIsSelected', 'renderedSystem', 'renderedSystemOrbitals', 'clickedWaypoint', 'selectedShip', 'shipInfoMenuIsSelected', 'shipMustMove', 'updateShipInfo', 'openedWaypoint']),

        getFuel() {
            return `Fuel: ${this.ship.fuel.current}/${this.ship.fuel.capacity}`
        },

        ship_destination() {
            return this.ship_destinations[0]
        },
        debug_menu_symbol() {
            return this.debug_is_toggled ? '▼' : '▶'
        },

        getShipCondition() {
            let ship_condition = 0
            let total_components = 0
            for (const [index, item] of Object.entries(this.ship)) {
                if (Object.hasOwn(item, 'condition')) {
                    ship_condition += item.condition
                    total_components += 1
                }
            }

            return ship_condition / total_components
        },

        colorShipStatus() {
            if (this.ship.nav.status === 'DOCKED') {
                return '#c443ef'
            } else {
                return '#4a14eb'
            }
        }
    },

    watch: {
        'appStore.clickedWaypoint'(newValue, oldValue) {
            if (this.isSelected) {
                this.ship_destinations = this.appStore.clickedWaypoint
            }
        },
        'appStore.shipMustMove'(newValue, oldValue) {
            if (newValue === this.ship.symbol) {
                this.moveShip()
                this.appStore.shipMustMove = false
            }
        },

        async 'appStore.updateShipInfo'(newValue, oldValue) {
            if (newValue === this.ship.symbol) {

                const options = {
                    method: 'GET',
                    headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${this.token}`,
                    }
                }

                const new_ship = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}`, options)
                this.ship = new_ship.data

                this.appStore.updateShipInfo = false
            }
        },

        'appStore.renderedSystem'(newValue, oldValue) {
            if (newValue === this.ship.nav.systemSymbol) {
                this.shipIsInSystem = true
            } else {
                this.shipIsInSystem = false
            }
            //console.log('is in system?', this.shipIsInSystem)
        }
    },



    methods: {
        getConditionColor(condition) {
            if (condition >= 75) {return 'green'}
            if (condition <75 && condition >=40) {return 'darkgoldenrod'}
            if (condition <40) {return 'red'}
        },
        unselectShip() {
            if (this.isSelected && this.appStore.shipInfoMenuIsSelected === false) {
                this.appStore.shipIsSelected = false
                this.appStore.selectedShip = false
                this.isSelected = false

                this.ship_flags = this.ship_flags.slice(0, 16)
            }
            
        },

        selectShip() {
            this.appStore.shipIsSelected = true

            if (this.appStore.openedWaypoint === false) {
                this.appStore.selectedShip = this.ship
            }
            

            this.isSelected = true

            this.ship_flags = `${this.ship_flags}, #01bbff -.3em 0em`
        },


        async moveShip() {

            const options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                }
            };
            
            const ship_nav = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.symbol}/nav`, options)
            this.ship_debug_object = ship_nav

                const dep_time = new Date(ship_nav.data.route.departureTime).getTime()
                const arrv_time = new Date(ship_nav.data.route.arrival).getTime()
                this.time_till = arrv_time - dep_time

                for (const orbital_array of this.raw_rendered_orbitals) {
                    for (const orbital of orbital_array) {
                        if (orbital == this.ship_destinations[0]) {
                            switch(orbital_array.indexOf(orbital)) {
                                case 0:
                                    this.destination_orbital_x_distortion = this.em/4 * -1
                                break
                                case 1:
                                    this.destination_orbital_x_distortion = this.em/10
                                break
                                case 2:
                                    this.destination_orbital_x_distortion = this.em/3
                                break
                            }
                            switch(orbital_array.indexOf(orbital)) {
                                case 0:
                                    this.destination_orbital_y_distortion = this.em/4 * -1
                                break
                                case 1:
                                    this.destination_orbital_y_distortion = this.em/2.86 * -1
                                break
                                case 2:
                                    this.destination_orbital_y_distortion = this.em/50
                                break
                            }
                        }
                    }
                }

                anime({
                    targets: this.$refs[this.symbol],
                    translateX: [
                        {value: (ship_nav.data.route.departure.x / 2.86 * this.one_vw_in_px) + (this.one_vw_in_px * 10) + (this.one_vw_in_px * .2) + this.orbital_x_distortion, duration: 0, easing: 'linear'},
                        {value: (ship_nav.data.route.destination.x / 2.86 * this.one_vw_in_px) + (this.one_vw_in_px * 10) + (this.one_vw_in_px * .2) + this.destination_orbital_x_distortion, duration: this.time_till, delay: 0, easing: 'linear'},
                    ],
                    translateY: [
                        {value: (ship_nav.data.route.departure.y / 2.86 * this.one_vh_in_px) - (this.one_vh_in_px * 10) - (this.one_vh_in_px * 4) + this.orbital_y_distortion, duration: 0, easing: 'linear'},
                        {value: (ship_nav.data.route.destination.y / 2.86 * this.one_vh_in_px) - (this.one_vh_in_px * 10) - (this.one_vh_in_px * 4) + this.destination_orbital_y_distortion, duration: this.time_till, delay: 0, easing: 'linear'},
                    ]
                })



                this.unselectShip()

                await delay(this.time_till)

                this.ship.nav.status = 'IN_ORBIT'
        },


        


    },
}

</script>

<template >
<div v-clickOutside="unselectShip">
    <div :style="{boxShadow: ship_flags}" :ref="symbol + '-container'" class="ship-object-container"  @click.up="selectShip">
        <div class="ship-top">
            <div class="DUNE" style="flex:2;">{{ symbol }}</div>
            <div style="flex:1; font-size: small;">Condition: <mark :style="{color: getConditionColor(getShipCondition)}" class="money-text">{{ getShipCondition }}%</mark></div>
        </div>

        <div class="ship-frame-info">
            <div class="ship-frame-value">{{ ship.registration.role }}</div>
            <div v-if="ship.cargo.capacity > 0">Cargo: {{ ship.cargo.units }} / {{ ship.cargo.capacity }}</div>
            
        </div>

        <div class="ship-location-info">
            <div style="flex: 3; display: flex; flex-direction: row;">
            <div class="ship-status-div" :style="{ color: colorShipStatus }">{{ ship.nav.status }} </div>
            <div> at {{ ship.nav.waypointSymbol }}</div>
        </div>
            <div style="flex: 1">{{ getFuel }}</div>
        </div>
    </div>
    <div class="ship-map-symbol-container">
        <div v-show="shipIsInSystem" :ref="symbol" @click.up="selectShip" class="ship-map-symbol"></div>
        
    </div>
</div>
</template>

