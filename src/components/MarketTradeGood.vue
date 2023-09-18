<script>
import { callApi, delay, apiCallCounter } from '../App.vue'
import { mapState } from 'pinia';
import { useAppStore } from '../stores/appStore';

export default {

    props: {
        content: 'no content?',
        selectable_ships: Array,
        token: String,
    },
    data() {
        return {
            appStore: useAppStore(),

            isFuel: false,

            buy_amount: 1,
            sell_amount: 1,
            total_bought: 0,
            total_sold: 0,

            good_debug: false,
        }
    },

    mounted() {
        if (this.content.symbol === 'FUEL') {
            this.isFuel = true
        }
    },

    methods: {
        getScarcityColor(scarcity) {
            switch(scarcity) {
                case 'SCARCE':
                    return 'red'
                case 'LIMITED':
                    return '#fd6a00'
                case 'MODERATE':
                    return 'yellow'
                case 'ABUNDANT':
                    return 'green'
            }
        },

        async buyGood() {
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${this.token}`
            },
            body: `{"symbol":"${this.content.symbol}","units":${this.buy_amount}}`
            };
            const bought_good = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.$parent.selected_ship}/purchase`, options)
            console.log(bought_good)
            if (Object.hasOwn(bought_good, 'error')) {
                this.good_debug = bought_good
            } else {
                this.good_debug = false

                this.appStore.updateShipInfo = this.$parent.selected_ship
                this.total_bought += bought_good.data.transaction.units
            }

            
        },
        async sellGood() {
            const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${this.token}`
            },
            body: `{"symbol":"${this.content.symbol}","units":${this.sell_amount}}`
            };
            const sold_good = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.$parent.selected_ship}/sell`, options)
            if (Object.hasOwn(sold_good, 'error')) {
                this.good_debug = sold_good
            } else {
                this.good_debug = false

                this.appStore.updateShipInfo = this.$parent.selected_ship
                this.total_sold += sold_good.data.transaction.units
            }

            
        },

        async refuel() {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: `{"units":"${Math.ceil(this.getRefuelUnits)}"}`
            };

            const refuel_ship = await callApi(`https://api.spacetraders.io/v2/my/ships/${this.$parent.selected_ship}/refuel`, options)

            if (Object.hasOwn(refuel_ship, 'error')) {
                this.good_debug = refuel_ship
            } else {
                this.good_debug = false

                this.appStore.updateShipInfo = this.$parent.selected_ship
            }
        }
    },

    computed: {
        ...mapState(useAppStore, ['selectedShip', 'updateShipInfo']),

        calcSellPrice() {
            let sale_price = this.content.sellPrice * this.sell_amount
            return sale_price
        },
        calcBuyPrice() {
            let buy_price = this.content.purchasePrice * this.buy_amount
            return buy_price
        },

        getRefuelUnits() {
            for (const ship of this.selectable_ships) {
                if (ship.symbol === this.$parent.selected_ship) { //should only happen once
                    const fuel_restock_amount = ship.fuel.capacity - ship.fuel.current 
                    return (fuel_restock_amount * this.content.purchasePrice) / 100
                } else {
                    return '<select ship to calculate fuel costs>'
                }
            }
        }
    }


}


</script>
<template>
    <div>{{ content.symbol }}</div>
    <div class="market-tradeGood-info-container">
        <div class="market-tradeGood-info-inner-container">
            <div>Trade Volume: {{ content.tradeVolume }}</div>
            <div>Buy: ₹{{ content.purchasePrice }}</div>
            <div class="market-tradeGood-exchange-container">
                <div>Buy <input type="number" size="5" v-model="buy_amount"> unit(s) for <mark class="money-text">₹{{ calcBuyPrice }}</mark></div>
                <div class="market-tradeGood-exchange">
                    <div @click="buyGood()" class="market-tradeGood-exchange-button">Buy</div>
                    <div v-if="total_bought > 0" class="market-tradeGood-exchange-info">{{ total_bought }} units bought in total</div>
                </div>
                
            </div>
        </div>
        <div>
            <div>Supply: <mark class="market-scarcity-text" :style="{ color: getScarcityColor(content.supply)}">{{ content.supply }}</mark></div>
            <div>Sell: ₹{{ content.sellPrice }}</div>
            <div class="market-tradeGood-exchange-container">
                <div>Sell <input type="number" size="5" v-model="sell_amount"> unit(s) for <mark class="money-text">₹{{ calcSellPrice }}</mark></div>
                <div class="market-tradeGood-exchange">
                    <div @click="sellGood()" class="market-tradeGood-exchange-button">Sell</div>
                    <div v-if="total_sold > 0" class="market-tradeGood-exchange-info"><mark class="money-text">{{ total_sold }}</mark> units sold in total</div>
                </div>
                
            </div>
        </div>

    </div>
    <div @click="refuel()" v-if="isFuel" class="refuel-button">Refuel <mark class="DUNE" style="background-color: inherit;">{{ $parent.selected_ship }}</mark> for <mark class="money-text">₹{{ getRefuelUnits }}</mark></div>
    <div v-if="good_debug" class="market-tradeGood-debug">{{ good_debug }}</div>
    
</template>
<style>

.market-tradeGood-info-container{
    display: flex;
    flex-direction: row;
}
.market-tradeGood-info-inner-container{
    display: flex;
    flex-direction: column;
    padding-right: 1em;
}
.market-scarcity-text{
    background-color: inherit;
    font-weight: bold;
}
.market-tradeGood-exchange-container{
    flex: 2;
    border-top: solid .1em #3a3153;
    padding-top: .5em;
    margin-top: .5em;
    color: black;
}
.market-tradeGood-exchange-button{
    background-color: yellow;
    color: maroon;
    cursor: pointer;
    border-radius: 10%;
    border: solid .1em #44195e;
    font-weight: bolder;
    padding: .5em;
    margin-top: .5em;
    margin-left: 1em;
    max-width: fit-content;
    flex: 1;
}
.market-tradeGood-exchange{
    display: flex;
    flex-direction: row;
}
.market-tradeGood-exchange-info{
    align-self: center;
    padding-left: .25em;
}

.refuel-button{
    cursor: pointer;
    margin: 1em;
    margin-top: 2em;
    padding: 1em;
    background-color: darkgoldenrod;
    color: black;
    border: black .25em inset;
    font-size: larger;
}

.market-tradeGood-debug{
    margin-top: 1em;
    color: rgb(207, 0, 0);
}

</style>