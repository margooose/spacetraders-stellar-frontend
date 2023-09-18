<script>
import { toRaw } from 'vue'
import { mapState } from 'pinia'
import { callApi, apiCallCounter, delay } from '../App.vue';
import { useAppStore } from '../stores/appStore';
import { clickOutside } from '../directives/clickoutside';
import ShipyardShipDynamicDropdown from './ShipyardShipDynamicDropdown.vue'
import MarketTradeGood from './MarketTradeGood.vue';

export default {
    directives: {
        clickOutside
    },

    components: {
        ShipyardShipDynamicDropdown,
        MarketTradeGood,
    },

    computed: {
        ...mapState(useAppStore, ['openedWaypoint', 'clickedWaypoint', 'waypointInfoMenuIsSelected', 'selectedShip', 'shipIsSelected', 'shipInfoMenuIsSelected', 'shipMustMove', 'updateShipInfo', 'shipSurveys', 'rerenderShips']),

        getIcon() {
            switch(this.waypoint.type) {
                case 'PLANET':
                    return 'background-image: url(src/assets/64x_habitable_planet.jpg)'
                case 'GAS_GIANT':
                    return 'background-image: url(src/assets/32x_gas_giant.png)'
                case 'ASTEROID_FIELD':
                    return 'background-image: url(src/assets/32x_asteroid_field.png)'
                case 'JUMP_GATE':
                    return 'background-image: url(src/assets/16x_jump_gate.png)'
                case 'MOON':
                    return 'background-image: url(src/assets/16x_colonized_moon.jpg)'
                case 'ORBITAL_STATION':
                    return 'background-image: url(src/assets/16x_orbital_station.jpg)'
            }
        },
        shipDebugDropdownSymbol() {
            return this.shipDebugSelected ? '▼' : '▶'
        },
        shipModulesDropdownSymbol() {
            return this.shipModulesSelected ? '▼' : '▶'
        },
        shipMountsDropdownSymbol() {
            return this.shipMountsSelected ? '▼' : '▶'
        },
        transactionDropdownSymbol() {
            return this.transactionsSelected ? '▼' : '▶'
        },
        importDropdownSymbol() {
            return this.importsSelected ? '▼' : '▶'
        },
        exportDropdownSymbol() {
            return this.exportsSelected ? '▼' : '▶'
        },
        exchangeDropdownSymbol() {
            return this.exchangeSelected ? '▼' : '▶'
        },


        getTotalShipCondition() {
            let ship_condition = 0
            for (const [index, item] of Object.entries(this.ship)) {
                if (Object.hasOwn(item, 'condition')) {
                    ship_condition += item.condition
                }
            }

            return ship_condition
        },
        getTotalShipConditionCapacity() {
            let total_components = 0
            for (const [index, item] of Object.entries(this.ship)) {
                if (Object.hasOwn(item, 'condition')) {
                    total_components += 1
                }
            }

            return total_components
        },
        

        getShipStatusColor() {
            if (this.ship.nav.status === 'DOCKED') {
                return 'rgb(196, 67, 239)'
            } else {
                return 'rgb(74, 20, 235)'
            }
        },


        getFlightModeFuelCalc() {
            switch(this.selected_flight_mode) {
                case 'CRUISE':
                    return '1 * distance'
                case 'DRIFT':
                    return '1'
                case 'BURN':
                    return '2 * distance'
                case 'STEALTH':
                    return '1 * distance'
            }
        },
        getFlightModeTimeCalc() {
            switch(this.selected_flight_mode) {
                case 'CRUISE':
                    return 15
                case 'DRIFT':
                    return 150
                case 'BURN':
                    return 7.5
                case 'STEALTH':
                    return 30
            }
        },
        getEstimatedFuel() {
            const destination_x = this.appStore.clickedWaypoint[1]
            const destination_y = this.appStore.clickedWaypoint[2]
            const departure_x = this.ship.nav.route.destination.x
            const departure_y = this.ship.nav.route.destination.y

            const distance_squared = ((destination_x - departure_x)**2)+((destination_y - departure_y)**2)
            const distance = Math.sqrt(distance_squared)
            if (isNaN(distance)) {
                return 'No Celestial Body Selected'
            }

            switch(this.selected_flight_mode) {
                case 'CRUISE':
                    return distance
                case 'STEALTH':
                    return distance
                case 'DRIFT':
                    return 1
                case 'BURN':
                    return 2 * distance
                default:
                    return 'no debug system?'
            }
        },
        getEstimatedTransitTime() {
            const destination_x = this.appStore.clickedWaypoint[1]
            const destination_y = this.appStore.clickedWaypoint[2]
            const departure_x = this.ship.nav.route.destination.x
            const departure_y = this.ship.nav.route.destination.y

            const distance_squared = ((destination_x - departure_x)**2)+((destination_y - departure_y)**2)
            const distance = Math.sqrt(distance_squared)

            if (isNaN(distance)) {
                return 'No Celestial Body Selected'
            }
            
            switch(this.selected_flight_mode) {
                case 'CRUISE':
                    var transit_multiplier = 15
                    break
                case 'STEALTH':
                    var transit_multiplier = 30
                    break
                case 'DRIFT':
                    var transit_multiplier = 150
                    break
                case 'BURN':
                    var transit_multiplier = 7.5
                    break
            }
            const travel_time = Math.floor(Math.round(Math.max(1, distance)) * (transit_multiplier/this.ship.engine.speed) + 15)
            return travel_time

        },
        
        clickedWaypointDefaultText() {
            if (!this.appStore.clickedWaypoint[0]) {
                return '<right click any celestial body>'
            }
        },

        getUsedModules() {
            let used_modules = 0
            for (const module of this.ship.modules) {
                used_modules += module.requirements.slots
            }
            return used_modules
        },

        shipHasUsefulComponent() {
            const UsefulComponents = {
                    'MINING': 'mounts',
                    'GAS': 'mounts',
                    'SURVEYOR': 'mounts',
                    'SENSOR': 'mounts',
                    'REFINERY': 'modules',

                    'WARP': 'modules',
                    'JUMP': 'modules'
                }
                for (const component_name in UsefulComponents) {
                    for (const component of this.ship[UsefulComponents[component_name]]) {
                        if (component.symbol.includes(component_name)) {
                            switch(component_name) {
                                case 'MINING':
                                    this.shipMiningComponent = component
                                    break
                                case 'GAS':
                                    this.shipGasComponent = component
                                    break
                                case 'SURVEYOR':
                                    this.shipSurveyingComponent = component
                                    break
                                case 'SENSOR':
                                    this.shipSensingComponent = component
                                    break
                                case 'REFINERY':
                                    this.shipRefiningComponent = component
                                    break

                                case 'WARP':
                                    this.shipWarpComponent = component
                                    break
                                case 'JUMP':
                                    this.shipJumpComponent = component
                                    break
                            }
                        }
                    }
                }
        },

        getShipDebugColor() {
            if (this.ship_debug) {
                return 'red'
            } else {
                return 'inherit'
            }
            
        }

        
    },

    data() {
        return {
            appStore: useAppStore(),
            token: String,

            waypoint: false,
            ship: false,
            ship_symbol: '',

            hasMarket: false,
            hasShipyard: false,

            waypointInfoIsSelected: true,
            marketInfoIsSelected: false,
            shipyardInfoIsSelected: false,

            mainInfoSelected: true,
            actionInfoSelected: false,
            frameInfoSelected: false,

            market: false,
            tradeGoods: Array,
            transactionsSelected: false,
            importsSelected: false,
            exportsSelected: false,
            exchangeSelected: false,
            selected_ship: '<select ship>',
            selectable_ships: [],

            shipyard: false,
            ships_for_sale: Array,


            ship_debug: false,

            selected_flight_mode: 'CRUISE',
            selected_flight_type: 'NAVIGATE',
            shipDebugSelected: false,
            shipModulesSelected: false,
            shipMountsSelected: false,

            movement_type: 'navigate',
            movement_options: Object,

            ship_action: false,
            selected_survey: false,
            selected_refinery_product: false,

            shipMiningComponent: false,
            shipGasComponent: false,
            shipSurveyingComponent: false,
            shipSensingComponent: false,
            shipRefiningComponent: false,
            shipWarpComponent: false,
            shipJumpComponent: false,
        }
    },



    watch: {
        'appStore.openedWaypoint'(newValue, oldValue) {
            if (newValue !== false) {//all this is basically the mounted stuff
                this.token = this.$parent.token
                this.waypoint = this.appStore.openedWaypoint

                for (const trait of this.waypoint.traits) {
                    if (trait.symbol === 'MARKETPLACE') {
                        this.hasMarket = true
                    }
                    if (trait.symbol === 'SHIPYARD') {
                        this.hasShipyard = true
                    }
                }
            }
            if (!newValue) {
                Object.assign(this.$data, this.$options.data())
            }
        },
        'appStore.selectedShip'(newValue, oldValue) {
            if (newValue.symbol !== oldValue.symbol && newValue !== false && this.appStore.openedWaypoint === false) { //mounted for selectedShip
                this.token = this.$parent.token

                this.ship = this.appStore.selectedShip
                this.ship_symbol = this.ship.symbol
                if (this.ship.nav !== undefined) {
                    this.selected_flight_mode = this.ship.nav.flightMode
                }

                this.shipHasUsefulComponent

                
            }
            if (newValue === false) {
                //idk what to do with this
            }
            if (!newValue) {
                Object.assign(this.$data, this.$options.data())
            }
        },
        /*'appStore.selectedShip.cargo': { //was making cargo disappear on ship unselect - also, i don't know if it did anything
            handler(newValue, oldValue) {
                
                if (this.ship.cargo != newValue && this.ship !== false && newValue !== undefined) {
                    this.ship.cargo = newValue
                }
                
            },
            deep: true
        },*/
        
    },


    methods: {
        keepWaypointInfoOpen() {
            this.appStore.waypointInfoMenuIsSelected = true
        },
        closeWaypointInfo() {
            this.appStore.waypointInfoMenuIsSelected = false
        },

        keepShipInfoOpen() {
            this.appStore.shipInfoMenuIsSelected = true
        },
        closeShipInfo() {
            this.appStore.shipInfoMenuIsSelected = false
        },

        openMainTab() {
            this.mainInfoSelected = true
            this.actionInfoSelected = false
            this.frameInfoSelected = false

        },
        openActionTab() {
            this.mainInfoSelected = false
            this.actionInfoSelected = true
            this.frameInfoSelected = false

        },
        openFrameTab() {
            this.mainInfoSelected = false
            this.actionInfoSelected = false
            this.frameInfoSelected = true
        },

        openWaypointMainTab() {
            this.marketInfoIsSelected = false
            this.shipyardInfoIsSelected = false
            this.waypointInfoIsSelected = true
        },
        async openMarketTab() {
            this.shipyardInfoIsSelected = false
            this.waypointInfoIsSelected = false
            this.marketInfoIsSelected = true

            if (this.market === false) {
                const options = {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${this.token}`
                    },
                };

                this.market = await callApi(`https://api.spacetraders.io/v2/systems/${this.waypoint.systemSymbol}/waypoints/${this.waypoint.symbol}/market`, options)
                this.tradeGoods = this.market.data.tradeGoods
                for (const ship of this.$parent.ships) {
                    if (ship.nav.waypointSymbol === this.waypoint.symbol) {
                        this.selectable_ships.push(ship)
                    }
                }
            }
        },
        async openShipyardTab() {
            this.marketInfoIsSelected = false
            this.waypointInfoIsSelected = false
            this.shipyardInfoIsSelected = true
            
            if (this.shipyard === false) {
                const options = {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${this.token}`
                    },
                };
                
                this.shipyard = await callApi(`https://api.spacetraders.io/v2/systems/${this.waypoint.systemSymbol}/waypoints/${this.waypoint.symbol}/shipyard`, options)
                

                this.ships_for_sale = this.shipyard.data.ships
            }
            
        },
        async buyShip(ship_type) {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: `{"shipType":"${ship_type}","waypointSymbol":"${this.waypoint.symbol}"}`
            };
            const buy_ship = await callApi(`https://api.spacetraders.io/v2/my/ships`, options)

            if (Object.hasOwn(buy_ship, 'error')) {
                alert(buy_ship.error.message)
            } else {
                this.appStore.rerenderShips = true
            }
        },

        async jettisonCargo(item) {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: `{"symbol":"${item.symbol}","units":1}`
            };

            const jettison_cargo = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/jettison`, options)
            if (Object.hasOwn(jettison_cargo, 'error')) {
                this.ship_debug = jettison_cargo
            } else {
                this.ship_debug = false

                this.ship.cargo = jettison_cargo.data.cargo
            }
        },
        getShipCargoStyle(item) {
            const cargo_flex = item.units
            return cargo_flex
        },
        getRandomColor(index) {
            const inv_index = index
            if (this.ship.cargo.inventory[inv_index].random_color === undefined) {
            const hexDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "a", "b", "c", "d", "e", "f"];
            let random_color = '#'
            for (let i = 0; i < 6; i++) {
                const index = Math.floor(Math.random() * hexDigits.length)
                random_color += hexDigits[index]
            }
            //console.log(random_color)
            this.ship.cargo.inventory[inv_index].random_color = random_color
            return this.ship.cargo.inventory[inv_index].random_color
            } else {
                return this.ship.cargo.inventory[inv_index].random_color
            }
              
        },

        async moveShip() {
            //let options //options and movement_type gets changed based on move_type


            switch (this.selected_flight_type) {
                case 'NAVIGATE':
                    this.movement_options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: `Bearer ${this.token}`
                        },
                        body: `{"waypointSymbol":"${this.appStore.clickedWaypoint[0]}"}`
                    };
                    this.movement_type = 'navigate'
                    break;
                
                case 'JUMP GATE':
                case 'JUMP':
                    
                    this.movement_options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: `Bearer ${this.token}`
                        },
                        body: `{"systemSymbol":"${this.appStore.clickedWaypoint[0]}"}`
                    };
                    this.movement_type = 'jump'
                    break;

                case 'WARP':
                    const random_options = {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${this.token}`
                        },
                    };
                    const randomWaypoint = await callApi(`https://api.spacetraders.io/v2/systems/${this.appStore.clickedWaypoint[0]}`, random_options)
            
                    this.movement_options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: `Bearer ${this.token}`
                        },
                        body: `{"waypointSymbol":"${randomWaypoint.data.waypoints[0].symbol}"}`
                    };
                    this.movement_type = 'warp'
            }
            
            

            console.log(this.movement_options, this.movement_type, this.selected_flight_type)
            const move_ship = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/${this.movement_type}`, this.movement_options)
            this.appStore.updateShipInfo = this.ship.symbol

            if (Object.hasOwn(move_ship, 'error')) {
                this.ship_debug = move_ship
            } else {
                this.ship_debug = false

                this.ship.fuel = move_ship.data.fuel

                this.appStore.shipMustMove = this.ship.symbol
            }
        },
        clearSelectedWaypoint() {
            this.appStore.clickedWaypoint = []
        },

        async orbitShip() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
            }

            const orbit_ship = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/orbit`, options)
            this.appStore.updateShipInfo = this.ship.symbol

            if (Object.hasOwn(orbit_ship, 'error')) {
                this.ship_debug = orbit_ship
            } else {
                this.ship_debug = false

                this.ship.nav = orbit_ship.data.nav
            }
        },
        async dockShip() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
            }

            const dock_ship = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/dock`, options)
            this.appStore.updateShipInfo = this.ship.symbol

            if (Object.hasOwn(dock_ship, 'error')) {
                this.ship_debug = dock_ship
            } else {
                this.ship_debug = false

                this.ship.nav = dock_ship.data.nav
            }
        },

        async switchFlightMode() {
            if (this.selected_flight_mode === this.ship.nav.flightMode) {
                console.log('no change grrrr', this.selected_flight_mode, this.ship.nav.flightMode)
            } else {
            const options = {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: `{"flightMode":"${this.selected_flight_mode}"}`
            };

            const change_flight_mode = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/nav`, options)
            //i dont think this needs to update the ship

            if (Object.hasOwn(change_flight_mode, 'error')) {
                this.ship_debug = change_flight_mode
            } else {
                this.ship_debug = false

                this.selected_flight_mode = change_flight_mode.data.flightMode
                this.ship.nav.flightMode = change_flight_mode.data.flightMode
            }
            
            
        }},

        getConditionColor(condition) {
            if (condition >= 75) {return 'green'}
            if (condition <75 && condition >=40) {return 'darkgoldenrod'}
            if (condition <40) {return 'red'}
        },

        async surveyAction() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
            }
            const surveys = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/survey`, options)
            if (Object.hasOwn(surveys, 'error')) {
                this.ship_debug = surveys
            } else {
                this.ship_debug = false

                this.ship_action = surveys.data.surveys
                for (const survey of surveys.data.surveys) {
                    this.appStore.shipSurveys.push(survey)
                }
                console.log('survey: ', surveys.data.surveys)
            }
        },
        async extractAction() {
            if (this.selected_survey !== false) {
                console.log('use survey')
                var options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: `${JSON.stringify(this.selected_survey)}`
                }
            } else {
                console.log('no survey :(')
                var options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
                }
            }
            const extract = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/extract`, options)

            if (Object.hasOwn(extract, 'error')) {
                this.ship_debug = extract
            } else {
                this.ship_debug = false

                this.ship_action = extract.data.extraction.yield

                this.ship.cargo = extract.data.cargo
                this.appStore.updateShipInfo = this.ship.symbol
            }
        },

        async scanShipsAction() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
            }
            const scanned_ships = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/scan/ships`, options)

            if (Object.hasOwn(scanned_ships, 'error')) {
                this.ship_debug = scanned_ships
            } else {
                this.ship_debug = false

                this.ship_action = scanned_ships.data
            }
        },
        async scanWaypointsAction() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
            }
            const scanned_waypoints = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/scan/waypoints`, options)

            if (Object.hasOwn(scanned_waypoints, 'error')) {
                this.ship_debug = scanned_waypoints
            } else {
                this.ship_debug = false

                this.ship_action = scanned_waypoints.data
            }
        },
        async scanSystemsAction() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: undefined
            }
            const scanned_systems = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/scan/systems`, options)

            if (Object.hasOwn(scanned_systems, 'error')) {
                this.ship_debug = scanned_systems
            } else {
                this.ship_debug = false

                this.ship_action = scanned_systems.data
            }
        },

        async refineAction() {
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${this.token}`
            },
            body: `{"produce":"${this.selected_refinery_product}"}`
            };
            const refined_materials = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.ship.symbol}/refine`, options)

            if (Object.hasOwn(refined_materials, 'error')) {
                this.ship_debug = refined_materials
            } else {
                this.ship_debug = false

                this.ship_action = refined_materials.data.produced
                this.ship.cargo = refined_materials.data.cargo
                this.appStore.updateShipInfo = this.ship.symbol
            }
        }


        

    }

}


</script>
<template>
    <div v-if="this.appStore.openedWaypoint != false" @click="keepWaypointInfoOpen" v-clickOutside="closeWaypointInfo" id="waypoint-info-container">
        <div id="waypoint-info-tab-list">
            <div class="waypoint-info-tab" @click="openWaypointMainTab" :style="getIcon"></div>
            <div v-if="hasMarket" @click="openMarketTab" class="waypoint-info-tab" style="background-image: url(src/assets/16x_market_icon.png);"></div>
            <div v-if="hasShipyard" @click="openShipyardTab" class="waypoint-info-tab" style="background-image: url(src/assets/16x_shipyard_icon.png);"></div>
        </div>
        <div v-if="waypointInfoIsSelected" class="waypoint-information" id="waypoint-info-main">
            <div id="waypoint-info-left">
                <div style="font-size: larger;">{{ waypoint.symbol }}</div>
                <div v-if="waypoint.chart">Chart: {{ waypoint.chart.submittedBy }} - {{ waypoint.chart.submittedOn }}</div>
                <div>{{ waypoint.type }}</div>
                <div>({{ waypoint.x }}, {{ waypoint.y }})</div>
                <div>Orbitals: {{ waypoint.orbitals.length }}</div>
            </div>
            <div id="waypoint-info-right">
                <div style="font-size: larger;">Traits:</div>
                <div class="waypoint-info-trait" v-for="(item, index) in waypoint.traits">{{ item.name }}: <mark class="montserrat">{{ item.description }}</mark></div>
                
            </div>
        </div>
        <div v-if="marketInfoIsSelected" class="waypoint-information" id="waypoint-info-market">
            <div>Selected Ship:  
                <select v-model="selected_ship">
                    <option disabled value="">Select Ship</option>
                    <option v-for="(item, index) in selectable_ships">{{ item.symbol }}</option>
                </select>    
            </div>
            <div class="market-dropdown-container">
                <div class="market-dropdown" @click="importsSelected = !importsSelected">{{ importDropdownSymbol }} Imports</div>
                <div class="market-dropdown-item" v-if="importsSelected" v-for="(item, index) in market.data.imports">{{ item.symbol }} - <mark class="montserrat">{{ item.description }}</mark></div>
            </div>
            <div class="market-dropdown-container">
                <div class="market-dropdown" @click="exportsSelected = !exportsSelected">{{ exportDropdownSymbol }} Exports</div>
                <div class="market-dropdown-item" v-if="exportsSelected" v-for="(item, index) in market.data.exports">{{ item.symbol }} - <mark class="montserrat">{{ item.description }}</mark></div>
            </div>
            <div class="market-dropdown-container">
                <div class="market-dropdown" @click="exchangeSelected = !exchangeSelected">{{ exchangeDropdownSymbol }} Exchange</div>
                <div class="market-dropdown-item" v-if="exchangeSelected" v-for="(item, index) in market.data.exchange">{{ item.symbol }} - <mark class="montserrat">{{ item.description }}</mark></div>
            </div>
            
            <div v-if="tradeGoods" v-for="(item, index) in tradeGoods" class="market-tradeGood">
                <MarketTradeGood :content="item" :selectable_ships="selectable_ships" :token="token" />                
            </div>
            <div v-else>To see in-depth market information, you need to have a ship here at this waypoint</div>
            <div @click="transactionsSelected = !transactionsSelected" style="cursor: pointer;">{{ transactionDropdownSymbol }}Past Transactions</div>
            <div v-if="transactionsSelected">
                <div v-for="(item, index) in market.data.transactions">{{ item }}</div>
            </div>

        </div>
        <div v-if="shipyardInfoIsSelected" class="waypoint-information" id="waypoint-info-shipyard">
            <div v-if="ships_for_sale" class="shipyard-ship" v-for="(item, index) in ships_for_sale">
                <div class="shipyard-ship-first">
                    <div class="shipyard-ship-name">
                        <div><mark style="background-color: inherit; color: inherit; font-weight: bolder; font-size: large;">{{ item.name }}:</mark> <mark class="montserrat" style="background-color: inherit;">{{ item.description }}</mark></div>
                        <div>Fuel Capacity: <mark class="stats-text">{{ item.frame.fuelCapacity }}</mark></div>
                        <div>Module Slots: <mark class="crew-text">{{ item.frame.moduleSlots }}</mark></div>
                        <div>Mounting Slots: <mark class="power-text">{{ item.frame.mountingPoints }}</mark></div>
                    </div>
                    <div class="shipyard-ship-purchase-container">
                        <div class="shipyard-ship-purchase" @click="buyShip(item.type)">Purchase for ₹{{ item.purchasePrice }}</div>
                    </div>
                </div>
                <div class="shipyard-ship-stats-container">
                    <div class="shipyard-ship-stats">
                        <div class="shipyard-ship-stat-container">
                            <ShipyardShipDynamicDropdown title="Frame" :content="item.frame" />
                        </div>
                        <div class="shipyard-ship-stat-container">
                            <ShipyardShipDynamicDropdown title="Reactor" :content="item.reactor" />
                        </div>
                        <div class="shipyard-ship-stat-container">
                            <ShipyardShipDynamicDropdown title="Engine" :content="item.engine" />
                        </div>
                        <div class="shipyard-ship-stat-container">
                            <ShipyardShipDynamicDropdown title="Modules" :content="item.modules" />
                        </div>
                        <div class="shipyard-ship-stat-container">
                            <ShipyardShipDynamicDropdown title="Mounts" :content="item.mounts" />
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="waypoint-info-sparse-shipyard">
                <div style="flex:1; font-weight: bolder; font-size: larger;">Ships for Sale:</div>
                <div style="flex:2;">
                    <div v-for="(item, index) in shipyard.data.shipTypes">{{ item.type }}</div>
                </div>
                
                <div style="flex:1; font-weight:bold;">To see more information, position a ship at this shipyard</div>
            </div>
        </div>
        
    
    </div>

    <div v-if="this.appStore.shipIsSelected" @click="keepShipInfoOpen" v-clickOutside="closeShipInfo" id="ship-info-container">
        <div id="ship-info-tab-list">
            <div @click="openMainTab" class="ship-info-tab">Main</div>
            <div @click="openActionTab" class="ship-info-tab">Action</div>
            <div @click="openFrameTab" class="ship-info-tab">Frame</div>
        </div>
        <div v-if="mainInfoSelected" class="ship-info">
            <div id="ship-info-left">
                <div id="ship-info-top">
                    <div class="DUNE">{{ ship.symbol }}</div>
                    <div>Condition: <mark :style="{color: getConditionColor(getTotalShipCondition / getTotalShipConditionCapacity)}" class="money-text">{{ getTotalShipCondition }} / {{ getTotalShipConditionCapacity * 100 }}</mark></div>
                    <div>Fuel {{ ship.fuel.current }}/{{ ship.fuel.capacity }}</div>
                </div>
                <div id="ship-info-nav">
                    <div id="ship-info-nav-controls-container">
                        <div id="ship-info-nav-controls">
                            <div><mark class="money-text" :style="{ color: getShipStatusColor }">{{ ship.nav.status }}</mark> at {{ ship.nav.waypointSymbol }}</div>


                            <div><mark class="tooltip-anchor">ⓘ</mark> flight type: {{ selected_flight_type }}
                                <div class="tooltip-text">
                                    Your ship's flight type determines what kind of destination it can travel to. Navigate your ship to send it to waypoints
                                    within the system. If it has a warp drive, your ship can travel to another system. Warping is constrained by your drive's max range
                                    and your fuel capacity. If your ship has a jump drive, it can consume 1 antimatter to arrive at another system (within range) instantaneously.
                                    Alternatively, any ship can jump between systems with a jump gate.
                                </div>
                            </div>

                            <select v-model="selected_flight_type">
                                <option>NAVIGATE</option>
                                <option v-if="shipWarpComponent !== false">WARP</option>
                                <option v-if="shipJumpComponent !== false">JUMP</option>
                                <option>JUMP GATE</option>
                            </select>
                            <div>To: {{ clickedWaypointDefaultText }} {{ appStore.clickedWaypoint[0] }}</div>
                            <div>Estimated Fuel Usage: {{ getEstimatedFuel }}</div>
                            <div>Estimated Transit Time: {{ getEstimatedTransitTime }}</div>
                            <div id="ship-info-nav-buttons-container">
                                <div style="flex:.5;"></div>
                                <div @click="moveShip()" class="button" id="ship-confirm-movement">✔</div>
                                <div style="flex:1;"></div>
                                <div @click="clearSelectedWaypoint()" class="button" id="ship-reject-movement">X</div>
                                <div style="flex:1;"></div>
                            </div>
                        </div>
                        
                        <div id="ship-info-nav-flightMode-container">
                            
                            <div><mark class="tooltip-anchor">ⓘ</mark> flight mode: {{ selected_flight_mode }}
                                <div class="tooltip-text">
                                    Your ship's flight mode determines its speed, and the amount of fuel it consumes to get to a destination.
                                    Your selected flight mode has two main values: a fuel cost, multiplied by travel distance, and a time multiplier. 
                                </div>
                            </div>
                            <select @change="switchFlightMode()" v-model="selected_flight_mode">
                                <option v-if="this.ship.fuel.current > 0">CRUISE</option>
                                <option v-if="this.ship.fuel.current > 0">STEALTH</option>
                                <option v-if="this.ship.fuel.current > 0">BURN</option>
                                <option>DRIFT</option>
                            </select>
                            <div>Fuel Usage: {{ getFlightModeFuelCalc }}</div>
                            <div>Time Multiplier: {{ getFlightModeTimeCalc }} / (Speed = {{ ship.engine.speed }})</div>
                        </div>
                    </div>
                    <div id="ship-info-nav-status-control">
                        <div @click="orbitShip()" class="ship-info-nav-status-button" style="background-color: #2d2f2f; color: white;">Orbit</div>
                        <div @click="dockShip()" class="ship-info-nav-status-button" style="background-color: #3e00fb; color:#80fa05;">Dock</div>
                    </div>
                    <div style="flex: 1; flex-shrink: 0;">

                    </div>
                </div>
                <div class="ship-info-debug-container">
                    <div @click="shipDebugSelected = !shipDebugSelected" :style="{backgroundColor: getShipDebugColor}" class="ship-info-debug-title"> {{ shipDebugDropdownSymbol }} Debug:</div>
                    <div v-if="shipDebugSelected" class="ship-info-debug">{{ ship_debug }}</div>
                </div>
            </div>
            <div id="ship-info-right">
                

                
                <div style="margin-bottom: .5em; font-size: large;">Ship Cargo: {{ ship.cargo.units }} / {{ ship.cargo.capacity }}</div>
                <div id="ship-info-cargo-container">
                    <div id="ship-info-cargo">
                        <div :ref="'cargo-' + index" class="ship-info-cargo-item" :style="{ flex: getShipCargoStyle(item), backgroundColor: getRandomColor(index)}" v-for="(item, index) in ship.cargo.inventory"></div>
                        <div id="ship-info-cargo-whitespace" :style="{ flex: ship.cargo.capacity - ship.cargo.units}"></div>
                    </div>
                    <div id="ship-info-inventory-info">
                        <div class="ship-info-inventory-item" :style="{ borderColor: ship.cargo.inventory[index].random_color}" v-for="(item, index) in ship.cargo.inventory">
                            <div class="ship-info-inventory-left">
                                <div>{{ item.symbol }}: {{ item.units }}</div>
                                <div>{{ item.description }}</div>
                            </div>
                            <div class="ship-info-inventory-right">
                                <div @click="jettisonCargo(item)" class="ship-info-inventory-jettison">🗑</div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="actionInfoSelected" id="ship-action-container" class="ship-info">
            <div id="ship-action-left">
                <div v-if="shipMiningComponent || shipGasComponent || shipSurveyingComponent">
                    <div style="position: relative"><mark class="tooltip-anchor">ⓘ</mark> Selected Survey: {{ selected_survey.signature }}
                        <div style="max-width: 50%;" class="tooltip-text">
                            Using a survey allows you to more accurately get useful materials out of surveyed wayponts
                        </div>
                    </div>
                    <div class="ship-surveys-container">
                        <label v-for="(item, index) in this.appStore.shipSurveys" class="ship-survey-container">
                            <input type="radio" :value="item" v-model="selected_survey" />
                            <div class="ship-survey-info">
                                <div>{{ item.symbol }}</div>
                                <div>Signature: {{ item.signature }}</div>
                                <div>Expiration: {{ item.expiration }}</div>
                                <div>Size: {{ item.size }}</div>
                                <div>Deposits:</div>
                                <div>
                                    <div v-for="(item, index) in item.deposits" :key="item.signature" class="power-text">{{ item.symbol }}</div>
                                </div>
                            </div>
                        </label>
                        
                        </div>
                        <div>*Due to technical limitations, surveys will not be saved on page reload</div>
                    </div>
                        
                <div v-if="shipMiningComponent" class="ship-action-component">
                    <div>{{ shipMiningComponent.symbol }}</div>
                    <div>{{ shipMiningComponent.description }}</div>
                    <div @click="extractAction()" class="ship-action-button">Extract Minerals</div>
                </div>
                <div v-if="shipGasComponent" class="ship-action-component">
                    <div>{{ shipGasComponent.symbol }}</div>
                    <div>{{ shipGasComponent.description }}</div>
                    <div @click="extractAction()" class="ship-action-button">Extract Gas</div>
                </div>
                <div v-if="shipRefiningComponent" class="ship-action-component">
                    <div>{{ shipRefiningComponent.symbol }}</div>
                    <div>Refine 30 materials into 10: {{ selected_refinery_product }}</div>
                    <select v-model="selected_refinery_product">
                        <option disabled value="false">Select Refinery Product</option>
                        <option>Iron</option>
                        <option>Copper</option>
                        <option>Silver</option>
                        <option>Gold</option>
                        <option>Aluminum</option>
                        <option>Platinum</option>
                        <option>Uranite</option>
                        <option>Meritium</option>
                        <option>Fuel</option>
                    </select>
                    <div @click="refineAction()" class="ship-action-button">Refine</div>
                </div>
                <div v-if="shipSurveyingComponent" class="ship-action-component">
                    <div>{{ shipSurveyingComponent.symbol }}</div>
                    <div>{{ shipSurveyingComponent.description }}</div>
                    <div @click="surveyAction()" class="ship-action-button">Survey Waypoint</div>
                </div>
                <div v-if="shipSensingComponent" class="ship-action-component">
                    <div>{{ shipSensingComponent.symbol }}</div>
                    <div>{{ shipSensingComponent.description }}</div>
                    <div @click="scanShipsAction()" class="ship-action-button">Scan for Ships</div>
                    <div @click="scanWaypointsAction()" class="ship-action-button">Scan for Waypoints</div>
                    <div @click="scanSystemsAction()" class="ship-action-button">Scan for Systems</div>
                </div>
            </div>
            <div id="ship-action-right">
                <div v-if="ship_action.signature || ship_action.units">{{ ship_action }}</div> 
                <div v-if="ship_action.systems">
                    <div v-for="(item, index) in ship_action.systems" class="ship-action-scanned-object">
                        <div><mark class="power-text">{{ item.symbol }}</mark> - <mark class="crew-text">{{ item.type }}</mark></div>
                        <div>({{ item.x }}, {{ item.y }})</div>
                        <div>Distance: <mark class="stats-text">{{ item.distance }}</mark></div>
                    </div>
                </div>
                <div v-if="ship_action.waypoints">
                    <div v-for="(item, index) in ship_action.waypoints" class="ship-action-scanned-object">
                        <div><mark class="power-text">{{ item.symbol }}</mark> - <mark class="stats-text">{{ item.type }}</mark> - <mark class="crew-text">{{ item.faction.symbol }}</mark></div>
                        <div>({{ item.x }}, {{ item.y }})</div>
                        <div v-if="item.orbitals.length" class="ship-action-scanned-object-list">
                            <div>Orbitals:</div>
                            <div v-for="(item, index) in item.orbitals" class="ship-action-scanned-object-list-object">{{ item.symbol }}</div>
                        </div>
                        <div v-if="item.traits.length" class="ship-action-scanned-object-list">
                            <div>Traits:</div>
                            <div v-for="(item, index) in item.traits" class="ship-action-scanned-object-list-object">{{ item.symbol }}</div>
                        </div>
                    </div>
                </div>
                <div v-if="ship_action.ships">
                    <div v-for="(item, index) in ship_action.ships" class="ship-action-scanned-object">
                        <div><mark class="power-text">{{ item.symbol }}</mark> - <mark class="crew-text">{{ item.registration.factionSymbol }}</mark></div>
                        <div><mark class="stats-text">{{ item.registration.role }}</mark></div>
                    </div>
                </div>
                <div class="ship-info-debug-container">
                    <div @click="shipDebugSelected = !shipDebugSelected" :style="{backgroundColor: getShipDebugColor}" class="ship-info-debug-title"> {{ shipDebugDropdownSymbol }} Debug:</div>
                    <div v-if="shipDebugSelected" class="ship-info-debug">{{ ship_debug }}</div>
                </div>
            </div>
        </div>
        <div v-if="frameInfoSelected" id="ship-frame-container" class="ship-info">
            <div id="ship-frame-main">
                <div id="ship-frame-regulation">
                    <div class="DUNE">{{ ship.registration.name }}</div>
                    <div>{{ ship.registration.role }}</div>
                    <div>Faction - {{ ship.registration.factionSymbol }}</div>
                </div>
                <div class="ship-frame-container">
                    <div>{{ ship.frame.symbol }}</div>
                    <div>Condition: <mark :style="{color: getConditionColor(this.ship.engine.condition)}" class="money-text">{{ ship.frame.condition }}</mark></div>
                    <div class="montserrat">{{ ship.frame.description }}</div>
                    <div class="ship-info-requirements">
                        <div>Requirements</div>
                        <div class="ship-info-requirements-item">Crew: <mark class="crew-text">{{ ship.frame.requirements.crew }}</mark></div>
                        <div class="ship-info-requirements-item">Power: <mark class="power-text">{{ ship.frame.requirements.power }}</mark></div>
                    </div>
                </div>
                <div class="ship-frame-container">
                    <div @click="shipModulesSelected = !shipModulesSelected" class="ship-components-toggle">{{ shipModulesDropdownSymbol }} {{ getUsedModules }}/{{ ship.frame.moduleSlots }} Modules</div>
                    <div v-if="shipModulesSelected" class="ship-components-container">
                        <div v-for="(item, index) in this.ship.modules">
                            <div>{{ item.symbol }}</div>
                            <div class="ship-component-info">
                                <div v-if="item.strength">Strength:<mark class="stats-text">{{ item.strength }}</mark></div>
                                <div v-if="item.deposits"> Surveyable Deposits:<mark class="stats-text">{{ item.deposits }}</mark></div>
                                <div v-if="item.capacity">Capacity: <mark class="stats-text">{{ item.capacity }}</mark></div>
                                <div v-if="item.range">Range: <mark class="stats-text">{{ item.range }}</mark></div>
                                <div class="montserrat">{{ item.description }}</div>
                                <div class="ship-info-requirements">
                                    <div class="ship-info-requirements-item">Crew: <mark class="crew-text">{{ item.requirements.crew }}</mark></div>
                                    <div class="ship-info-requirements-item">Power: <mark class="power-text">{{ item.requirements.power }}</mark></div>
                                    <div class="ship-info-requirements-item">Slots: <mark class="slots-text">{{ item.requirements.slots }}</mark></div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
                <div class="ship-frame-container">
                    <div @click="shipMountsSelected = !shipMountsSelected" class="ship-components-toggle">{{ shipMountsDropdownSymbol }} {{ ship.mounts.length }}/{{ ship.frame.mountingPoints }} Mounts</div>
                    <div v-if="shipMountsSelected" class="ship-components-container">
                        <div v-for="(item, index) in this.ship.mounts">
                            <div>{{ item.symbol }}</div>
                            <div class="ship-component-info">
                                <div v-if="item.strength">Strength:<mark class="stats-text">{{ item.strength }}</mark></div>
                                <div v-if="item.deposits"> Surveyable Deposits:<mark class="stats-text">{{ item.deposits }}</mark></div>
                                <div class="montserrat">{{ item.description }}</div>
                                <div class="ship-info-requirements">
                                    <div class="ship-info-requirements-item">Crew: <mark class="crew-text">{{ item.requirements.crew }}</mark></div>
                                    <div class="ship-info-requirements-item">Power: <mark class="power-text">{{ item.requirements.power }}</mark></div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
            <div id="ship-frame-engine">
                <div>{{ ship.engine.symbol }}</div>
                <div>Condition: <mark :style="{color: getConditionColor(this.ship.engine.condition)}" class="money-text">{{ ship.engine.condition }}</mark></div>
                <div>Speed: <mark class="crew-text">{{ ship.engine.speed }}</mark></div>
                <div class="montserrat">{{ ship.engine.description }}</div>
                <div class="ship-info-requirements">
                    <div>Requirements</div>
                    <div class="ship-info-requirements-item">Crew: <mark class="crew-text">{{ ship.engine.requirements.crew }}</mark></div>
                    <div class="ship-info-requirements-item">Power: <mark class="power-text">{{ ship.engine.requirements.power }}</mark></div>
                </div>
            </div>
            <div id="ship-frame-reactor">
                <div>{{ ship.reactor.symbol }}</div>
                <div>Condition: <mark :style="{color: getConditionColor(this.ship.reactor.condition)}" class="money-text">{{ ship.reactor.condition }}</mark></div>
                <div>Output: <mark class="power-text">{{ ship.reactor.powerOutput }}</mark></div>
                <div class="montserrat">{{ ship.reactor.description }}</div>
                <div class="ship-info-requirements">
                    <div>Requirements</div>
                    <div class="ship-info-requirements-item">Crew: <mark class="crew-text">{{ ship.frame.requirements.crew }}</mark></div>
                </div>
            </div>
        </div>
    </div>

</template>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300&family=Ysabeau+SC&display=swap');
.montserrat{
    font-family: 'Montserrat', sans-serif;
    background-color: inherit;
}

#waypoint-info-container{
    display: flex;
    flex-direction: row;

    flex-grow: 1;
}
#waypoint-info-tab-list{
    flex: 0;
}
.waypoint-info-tab{
    background-size: cover;
    
    min-height: 2.5em;
    min-width: 2.5em;
    max-width: fit-content;
    
    border-style: solid;
    border-color: #902bf5;
    z-index: 2;
}
.waypoint-information{
    flex: 20;

    border-style: solid;
    border-color: #902bf5;
}

#waypoint-info-main{
    display: flex;
    flex-direction: row;
    background-color: #b1aebb;
}
#waypoint-info-left{
    flex: 1;

    display: flex;
    flex-direction: column;
}
#waypoint-info-right{
    flex: 1;
    display: flex;
    flex-direction: column;
}


#waypoint-info-market{
    display: flex;
    flex-direction: column;
    background-color: #b1aebb;
}
.market-tradeGood{
    display: flex;
    flex-direction: column;

    color: #44195e;
    background-color: #b1aebb;
    border-bottom: solid #3a3153;
    padding-top: 1em;
    padding-bottom: 1em;
    padding-left:.25em;
}
.market-dropdown-container{
    color: #44195e;
    padding-left: .25em;
}
.market-dropdown{
    cursor: pointer;
}
.market-dropdown-item{
    margin-left: .5em;
    padding-left: .5em;
    padding-top: .25em;
    border-left: solid .1em #3a3153;
    
}


#waypoint-info-shipyard{
    background-color: #b1aebb;
}
.shipyard-ship{
    color: #44195e;
    background-color: #b1aebb;
    border-bottom: solid #3a3153;
    padding-top: 1em;
    padding-bottom: 1em;
    padding-left:.25em;
}
.shipyard-ship-first{
    display: flex;
    flex-direction: row;
}
.shipyard-ship-name{
    flex: 4;
    font-family: 'Montserrat', sans-serif;
}
.shipyard-ship-purchase-container{
    flex: 1;
    display: flex;
    align-items: center;
}
.shipyard-ship-purchase{
    background-color: yellow;
    color: maroon;
    cursor: pointer;
    padding: .25em;
    border-radius: 10%;
}
.shipyard-ship-stats-container{
    display: flex;
    flex-direction: column;
}
.shipyard-ship-stats{
    flex: 1;
}
.shipyard-ship-stat-container{
    display: flex;
    flex-direction: column;
}
.waypoint-info-sparse-shipyard{
    background-color: #b1aebb;
    color:#44195e;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}





#ship-info-container{
    display: flex;
    flex-direction: row;

    flex-grow: 1;
}
#ship-info-tab-list{
    display: flex;
    flex-direction: column;
}
.ship-info-tab{
    border: solid .25em #01ffc4;
    color: #01ffc4;
    font-weight: bolder;
    padding: .5em;
    cursor: pointer;
}
.ship-info{
    background-color: #e5feff;
    border: solid .25em #01ffc4;
    flex-grow: 1;

    display: flex;
    flex-direction: row;
}

#ship-info-right{
    flex: 1;

    display: flex;
    flex-direction: column;
    align-items: stretch;
}
#ship-info-cargo-container {
    display: flex;
    flex-direction: row;
    align-items: stretch;
}
#ship-info-cargo{
    flex: 1;

    display: flex;
    flex-direction: column;
    border: black solid .25em;
}
#ship-info-inventory-info{
    flex: 4;
    padding-left: 1em;

    display: flex;
    flex-direction: column;
}
.ship-info-inventory-item{
    padding-left: .5em;
    margin-bottom: .5em;
    border-left: solid .125em #01bbff;

    display: flex;
    flex-direction: row;
}
.ship-info-inventory-left{
    flex: 8;
}
.ship-info-inventory-right{
    flex: 1;
}
.ship-info-inventory-jettison{
    background-color: #b84841;
    color:#5e3449;
    border: .15em #5e3449 solid;
    margin-right:.15em;
    padding: 0em .25em;
    max-width: fit-content;
    text-align: center;
    cursor: pointer;
}

#ship-info-left{
    flex: 2;
    padding-left: .25em;

    display: flex;
    flex-direction: column;
}
#ship-info-top{
    padding-top: .5em;
    display: flex;
    flex-direction: row;
}
#ship-info-top div{
    flex: 1;
}
#ship-info-nav{
    display: flex;
    flex-direction: row;
}
#ship-info-nav-controls-container{
    flex: 5;
    display: flex;
    flex-direction: row;
}
#ship-info-nav-controls{
    flex: 3;
    display: flex;
    flex-direction: column;
    position: relative;
    margin-right: 1em;
}
#ship-info-nav-buttons-container{
    display: flex;
    flex-direction: row;
    margin-top: 1em;
}
#ship-confirm-movement{
    flex: 1;
    background-color: #41B883;
    color: #34495E;
    border: .25em solid #34495E;
    font-weight: bolder;
}
#ship-reject-movement{
    flex: 1;
    background-color: #b84841;
    color: #5e3449;
    border: .25em solid #5e3449;
    font-weight: bolder;
}


#ship-info-nav-flightMode-container{
    flex: 2;
    display: flex;
    flex-direction: column;
    position: relative;
}
#ship-info-nav-status-control{
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: .5em;
}
.ship-info-nav-status-button{
    min-width: fit-content;
    text-align: center;
    cursor: pointer;
    font-weight: bolder;
    padding: 1em;
    margin-top: .5em;
}

#ship-frame-container{
    display: flex;
    flex-direction: row;
}
#ship-frame-main{
    flex: 3;
    margin-left: .5em;
}
#ship-frame-engine{
    flex: 1;
    display: flex;
    flex-direction: column;
}
#ship-frame-reactor{
    flex: 1;
    display: flex;
    flex-direction: column;
}
.ship-info-requirements{
    display: flex;
    flex-direction: column;
    margin-top: .25em;
}
.ship-info-requirements-item{
    flex: 1;
    padding-left: .25em;
    margin-left: .25em;
    border-left: blue solid .1em;
}
#ship-frame-regulation{
    display: flex;
    flex-direction: row;
}
#ship-frame-regulation div {
    padding-top: .25em;
    flex:1;
    font-weight: bolder;
}
.ship-frame-container{
    margin-bottom: 1em;
}
.ship-components-toggle{
    cursor: pointer;
    font-size: large;
}
.ship-components-container{
    display: flex;
    flex-direction: column;
}
.ship-component-info{
    padding-left: .25em;
    margin-left: 1em;
    border-left: .15em #01bbff solid;
}

#ship-action-container{
    display: flex;
    flex-direction: row;
}
#ship-action-left{
    flex: 3;
}
#ship-action-right{
    flex: 1;
}
.ship-action-component{
    margin-top: .5em;
    margin-bottom: .5em;
    margin-left: .5em;
    padding-left: 1em;
    border-left: solid .25em #ff9bfb;    
}
.ship-action-button{
    border: .25em darkolivegreen solid;
    padding: .5em;
    margin:1em;
    cursor: pointer;
    color: darkgreen;
    font-weight: bolder;
    background-color: #e5fff3;
    width: fit-content;
}
.ship-surveys-container{
    display: flex;
    flex-direction: row;
    margin-left: 1em;
}
.ship-survey-container{
    display: flex;
    flex-direction: row;
    border: .1em solid #34495E;
}
.ship-survey-info{
    display: flex;
    flex-direction: column;
}
.ship-action-scanned-object{
    display: flex;
    flex-direction: column;
    margin-top: 1em;
    padding: .25em;
    border: solid .1em blue;
}
.ship-action-scanned-object-list{
    display: flex;
    flex-direction: column;
    padding-top: .25em;
    padding-bottom: .25em;
}
.ship-action-scanned-object-list-object{
    padding-left: .5em;
    border-left: solid .1em darkgreen;
}




.ship-info-debug-container{
    margin-top: 1em;
    color: maroon;
}
.ship-info-debug-title{
    cursor: pointer;
}
</style>