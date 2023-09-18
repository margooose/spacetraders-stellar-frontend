<script>

export default {
    props: {
        title: String,
        content: 'no content?',
    },

    data() {
        return {
            isOpened: false,
            singularShipComponent: true,
        }
    },

    mounted() {
        switch(this.title) {
            case 'Modules':
                this.singularShipComponent = false
            break
            case 'Mounts':
                this.singularShipComponent = false
            break
        }
    },

    computed: {
        dropdownSymbol() {
            return this.isOpened ? '▼' : '▶'
        },
    },

    methods: {
        openDropdown() {
            this.isOpened = !this.isOpened
        }
    },


}
</script>
<template>
    <div v-if="singularShipComponent">
        <div class="shipyard-ship-stat-control" @click="openDropdown">{{ dropdownSymbol }} {{ title }} Information</div>
        <div v-if="isOpened" class="shipyard-ship-stat">
            <div>{{ content.symbol }}</div>
            <div>Description: {{ content.description }}</div>
            <div>Requirements: {{ content.requirements }}</div>
            
        </div>
    </div>
    <div v-else>
        <div class="shipyard-ship-stat-control" @click="openDropdown">{{ dropdownSymbol }} {{ title }} Information</div>
        <div v-if="isOpened" style="border-bottom: solid black 1px;" class="shipyard-ship-stat" v-for="(item, index) in content">
            <div>{{ item.symbol }}</div>
            <div>{{ item.description }}</div>
            <div v-if="item.capacity">Cargo Capacity: {{ item.capacity }}</div>
            <div v-if="item.production">Valid Ores: {{ item.production }}</div>
            <div v-if="item.strength">Strength: {{ item.strength }}</div>
            <div v-if="item.deposits">Surveyable Deposits: {{ item.deposits }}</div>
            <div>Requirements {{ item.requirements }}</div>
        </div>
    </div>
    
</template>
<style>
.shipyard-ship-stat-control {
    cursor: pointer;
    font-weight: bold;
}
.shipyard-ship-stat {
    border-left: solid black;
    padding-left: .5em;
}
</style>