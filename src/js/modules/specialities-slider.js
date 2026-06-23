import Splide from '@splidejs/splide';
function specialitiesSlider() {
	const el = document.querySelector('#specialities-splide');
	if (!el) return;
	new Splide(el, {
		type: 'slide',
		perPage: 8,
		gap: '24px',
		pagination: false,
		arrows: true,
		breakpoints: {
			1280: { perPage: 6 },
			992: { perPage: 5 },
			768: { perPage: 4 },
			576: { perPage: 3 },
			400: { perPage: 2 },
		},
	}).mount();
}
export default specialitiesSlider;
