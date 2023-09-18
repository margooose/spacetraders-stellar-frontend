export const clickOutside = {
    mounted: (el, binding) => {
        el.onClickOutsideEvent = event => {
            if (el !== event.target && !el.contains(event.target)) {
                binding.value()
            }
        }
        document.addEventListener('click', el.onClickOutsideEvent)
    },
    unmounted: el => {
        document.removeEventListener('click', el.onClickOutsideEvent)
    }
}