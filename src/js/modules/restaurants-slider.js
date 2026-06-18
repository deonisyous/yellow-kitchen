import Splide from '@splidejs/splide';

function restaurantsSlider() {
    const el = document.querySelector('#restaurants-splide');
    if (!el) return;

    new Splide(el, {
        type: 'slide',
        perPage: 4,
        gap: '24px',
        pagination: false,
        breakpoints: {
            992: { perPage: 2 },
            576: { perPage: 1 },
        },
    }).mount();
}

export default restaurantsSlider;