import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('appStore', {

  state: () => {
    return {
      rerenderShips: false,

      renderedSystem: Object,
      renderedSystemOrbitals: [],
      clickedWaypoint: [],
      shipMustMove: [],
      shipIsSelected: false, // bool
      updateShipInfo: false, // should either be false or object

      openedWaypoint: false, // should be either false or a waypoint object
      waypointInfoMenuIsSelected: false, // bool

      selectedShip: false, //should be either false or ship object
      shipInfoMenuIsSelected: false, // bool

      shipSurveys: [],

    }
  },

  getters: {

  },

  actions: {

  },

})
