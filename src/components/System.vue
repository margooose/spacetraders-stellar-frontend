
<script>
import Waypoint from './Waypoint.vue'

import anime from 'animejs/lib/anime.es.js'
import { render, h} from 'vue'
import {callApi, apiCallCounter, delay} from '../App.vue'

import {mapState} from 'pinia'
import {useAppStore} from '../stores/appStore'

import * as d3 from "d3";


export default {
    components: {
        Waypoint,
    },

    props: {
        token: String,
        initial_location: Object,

    },

    computed: {
        ...mapState(useAppStore, ['renderedSystemOrbitals', 'renderedSystem', 'shipIsSelected', 'rerenderShips']),

        
    },

    data() {
        return {
            appStore: useAppStore(),

            waypoints: Object,

            enableGalacticMap: false,
            ship_locations: [],

            star_type: String,
            star_color: String,
        }
    },

    async mounted() {

        const options = { // makes array of locations where ships are
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ('Bearer ' + this.token)
            },
        };
        const ships = await callApi('https://api.spacetraders.io/v2/my/ships', options)
        
        const ships_system_locations_dup = []
        for (const ship of ships.data) {
            ships_system_locations_dup.push(ship.nav.systemSymbol)
        }
        const ships_system_locations = [...new Set(ships_system_locations_dup)]

        const systems = await callApi('https://api.spacetraders.io/v2/systems.json', options)

        let max_x = -60000 // all these values are placeholders
        let min_x = 60000
        let max_y = -60000
        let min_y = 60000

        function FindMinMaxSysValues(system) {
            if (system.x > max_x) {
                max_x = system.x
            }
            if (system.x < min_x) {
                min_x = system.x
            }
            if (system.y > max_y) {
                max_y = system.y
            }
            if (system.y < min_y) {
                min_y = system.y
            }
        }


        for (const ship_system of ships_system_locations) {
            let found_system = systems.find(({symbol}) => symbol === ship_system)
            if (found_system) {
                FindMinMaxSysValues(found_system)
            }
        }

        
        const one_vh_in_px = document.getElementsByTagName('html')[0].clientHeight / 100
        const one_vw_in_px = document.getElementsByTagName('html')[0].clientWidth / 100
        let svg_width = 80 * one_vw_in_px, svg_height = 70 * one_vh_in_px
        let margin = {'top': 100, 'bottom': 50}
        let width = svg_width
        let height = svg_height - margin.top - margin.bottom

        let initial_zoom_x = this.initial_location.data.x
        let initial_zoom_y = this.initial_location.data.y
        let initial_zoom_symbol = this.initial_location.data.symbol
        let initial_zoom_cx = 0 //0 is a placeholder for these values
        let initial_zoom_cy = 0


        let svg = d3.select('#galactic-map')
            .append('svg')
            .attr('width', width)
            .attr('height', height + margin.top + margin.bottom)

        d3.json('https://api.spacetraders.io/v2/systems.json').then(json => {


            let xAxisScale = d3.scaleLinear()
                .domain([initial_zoom_x-500, initial_zoom_x+500])
                .range([0, width]);
            let xAxis = svg.append('g')
                .call(d3.axisBottom(xAxisScale))

            let yAxisScale = d3.scaleLinear()
                .domain([initial_zoom_y-500, initial_zoom_y+500])
                .range([height, 0]);
            let yAxis = svg.append('g')
                .call(d3.axisLeft(yAxisScale))


            let tooltip = d3.select('#galactic-map')
            .append('div')
                .style('visibility', 'hidden')
                .style('background-color', '#6a2e36')
                .style('position', 'absolute')
                .text('debug_text')


            let zoom = d3.zoom()
                .scaleExtent([1/32, 32])
                .on('zoom', zoomed)
            let initial_zoom = d3.zoom().on("zoom", function(event){
                scatter
                .attr("transform", event.transform);
            });


            svg.append('rect')
                .attr('width', svg_width)
                .attr('height', svg_height)
                .style('fill', 'none')
                .style('pointer-events', 'all')
                .call(zoom)
                

            let scatter = svg.append('g')
                .attr('clip-path', 'url(#clip)')
                
                
            let mouseover = function(event, d) {
                tooltip
                    .text(` ${d.symbol} | (${d.x}, ${d.y}) `)
                    .style('visibility', 'visible')
                    .style('left', (d3.pointer(event)[0] - 200)+'px')
                    .style('top', (d3.pointer(event)[1])+'px')
            }


            let renderClickedSystem = async (event, d) => {
                const options = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': ('Bearer ' + this.token)
                    },
                };

                const clickedSystem = await callApi(`https://api.spacetraders.io/v2/systems/${d.symbol}`, options)
                console.log(clickedSystem)
                this.enableGalacticMap = !this.enableGalacticMap
                this.renderWaypoints(clickedSystem)
                this.appStore.rerenderShips = true
            }



            function getSystemColor(system) {
                if (system.x >= min_x && system.x <= max_x && system.y >= min_y && system.y <= max_y) {
                    for (const ship_system of ships_system_locations) {
                        if (system.symbol === ship_system) {
                            return '#7dff00'
                        }
                    }
                } else {
                    return '#3477eb'
                }
            }


            scatter
            .selectAll("circle")
            .data(json)
            .enter()
            .append("circle")
                .attr("cx", function (d) {
                        if (d.symbol === initial_zoom_symbol) {
                            initial_zoom_cx = xAxisScale(d.x)
                        }
                        return xAxisScale(d.x); 
                    })
                .attr("cy", function (d) {
                        if (d.symbol === initial_zoom_symbol) {
                            initial_zoom_cy = yAxisScale(d.y)
                        }
                        return yAxisScale(d.y); 
                    })
                .attr("r", 5)
                .style("fill", function(d) {return getSystemColor(d)})
            .call(initial_zoom.transform, d3.zoomIdentity.translate(-initial_zoom_cx + 500, -initial_zoom_cy + 250))
            .on('contextmenu', (event, d) => {
                event.preventDefault()
                this.appStore.clickedWaypoint = []
                this.appStore.clickedWaypoint.push(d.symbol)
                console.log(this.appStore.clickedWaypoint[0])
            })
            .on('dblclick', renderClickedSystem)
            .on('mouseover', mouseover)
            .on('mouseout', function(event, d) {
                tooltip.style('visibility', 'hidden');
            })
            


            
            function zoomed(event, d) {
                let newX = event.transform.rescaleX(xAxisScale)
                let newY = event.transform.rescaleY(yAxisScale)
                xAxis.call(d3.axisBottom(newX))
                yAxis.call(d3.axisLeft(newY))

                let scaleMultiplier = event.transform.k


                scatter
                    .selectAll('circle')
                    .attr('cx', function(d) { return newX(d.x)
                    })
                    .attr('cy', function(d) { return newY(d.y)
                    })
                    .attr('r', function(d) { return (scaleMultiplier * 5) });
            }

        })


        this.renderWaypoints(this.initial_location)

    },

    methods: {
        async renderWaypoints(location) {//inputs location object

            this.appStore.renderedSystem = location.data.symbol

            this.appStore.renderedSystemOrbitals = []

            let waypoints_h_list = [] //where all the waypoints (incl the star) go into

            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': ('Bearer ' + this.token)
                },
            };
            this.waypoints = await callApi(`https://api.spacetraders.io/v2/systems/${location.data.symbol}/waypoints`, options)
            console.log(this.waypoints)

            //this all seperately gets the data for the star
            let star_type = location.data.type;
            switch(star_type.toLowerCase()) { //should assign color to star based on star type
                        case 'young_star':
                            this.star_color = 'lightblue';
                            break;
                        case 'blue_star':
                            this.star_color = 'blue'
                            break;
                        case 'orange_star':
                            this.star_color = 'orange'
                            break;
                        case 'red_star':
                            this.star_color = 'red'
                            break;
                        case 'neutron_star':
                            this.star_color = '#8a2be2'
                            break;
                        case 'white_dwarf':
                            this.star_color = 'white'
                            break;
                        case 'black_hole':
                            this.star_color = 'black'
                            break;
                        case 'hybergiant':
                            this.star_color = 'pink'
                            break;
                        case 'nebula':
                            this.star_color = 'lightgreen'
                            break;
                        case 'unstable':
                            this.star_color = 'lightgray'
                            break;
                        default:
                            this.star_color = 'purple'
                            console.log('star color: case default')
                            break; 
                    };
            waypoints_h_list.push(
                h(Waypoint, {
                    token: this.token,
                    type: location.data.type,
                    symbol: location.data.symbol,
                    traits: [this.star_color, 'star'],  
                    x_coordinate: 0,
                    y_coordinate: 0,
                    orbitals: [],
                })
            )



            for (let waypoint in this.waypoints.data) { //checks whether something is an orbital, and how many orbitals a waypoint has

                if (this.waypoints.data[waypoint].type !== 'MOON' && this.waypoints.data[waypoint].type !== 'ORBITAL_STATION') {
                    const orbitals = this.waypoints.data[waypoint].orbitals

                    let actual_orbitals_list = []
                    if (this.waypoints.data[waypoint].orbitals.length !== 0) { //reel ugly code :(
                        var orbitals_symbol_list = []

                        for (const orbital of orbitals) {orbitals_symbol_list.push(orbital.symbol);}//testing out dif between forin & forof

                        for (const actual_orbital in orbitals_symbol_list) { 
                            for (const waypoint_but in this.waypoints.data) {
                                if (this.waypoints.data[waypoint_but].symbol === orbitals_symbol_list[actual_orbital]) {
                                    actual_orbitals_list.push(this.waypoints.data[waypoint_but])
                                }
                            }
                        }
                        this.appStore.renderedSystemOrbitals.push(orbitals_symbol_list)
                    }


                    waypoints_h_list.push(
                        h(Waypoint, {
                            token: this.token,
                            waypoint: this.waypoints.data[waypoint],
                            type: this.waypoints.data[waypoint].type,
                            symbol: this.waypoints.data[waypoint].symbol,
                            traits: this.waypoints.data[waypoint].traits,
                            x_coordinate: this.waypoints.data[waypoint].x,
                            y_coordinate: this.waypoints.data[waypoint].y,

                            orbitals: actual_orbitals_list,
                    }))
                }
                
            }
            render(
                h('div', waypoints_h_list), 
                this.$refs['system_container']
            )
            console.log(this.$refs['system_container'])
        }
    }

};

</script>
<template>
    <div ref="system_container" class="system-container">
        
    </div>
    <div id="galactic-map-toggle-container">
        <div style="flex:1"></div>
        <div @click="enableGalacticMap = !enableGalacticMap" style="flex:1" id="galactic-map-toggle">System Map</div>
        <div style="flex:1"></div>
    </div>
    <div v-show="enableGalacticMap" id="galactic-map"></div>
</template>
<style>
.system-container{
    background-color: black;

    height: 100%;
    width: 100%;
    display: flex;

    z-index: 0;
}
.system-container > div {
    width: 100%;
    height: 100%;
    z-index: 0;
    position: relative;
}

#galactic-map-toggle-container{
    background-color: black;
    z-index: 2;
    position: relative;
    transform: translate(0%, -100%);
    display: flex;
    flex-direction: row;
}
#galactic-map-toggle{
    text-align: center;
    padding: .5rem;
    background-color: #6e2a36;
    border: .5rem solid #ff084a;
    color: #ff084a;
    font-weight: bolder;
    font-size: larger;
    cursor: pointer;
    position: relative;
    z-index: 11;
}
#galactic-map{
    position: absolute;
    min-width: 60vw;
    min-height: 60vh;
    background-color: black;
    border-radius: 1em;
    color: #ff084a;
    top: 0;

    z-index: 1;
}


</style>