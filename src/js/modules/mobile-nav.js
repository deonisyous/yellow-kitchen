function mobileNav() {
	const navBtn = document.querySelector('.mobile-nav-btn');
	const nav = document.querySelector('.mobile-nav');
	const menuIcon = document.querySelector('.nav-icon');
	const navLinks = document.querySelectorAll('.mobile-nav a');

	if (!navBtn || !nav || !menuIcon) {
		return;
	}

	const getTabletBreakpoint = () => {
		const breakpoint = getComputedStyle(document.documentElement)
			.getPropertyValue('--tablet-size')
			.trim();

		return Number.parseInt(breakpoint, 10) || 1220;
	};

	const closeMobileNav = () => {
		nav.classList.remove('mobile-nav--open');
		nav.setAttribute('aria-hidden', 'true');
		nav.inert = true;
		navBtn.setAttribute('aria-expanded', 'false');
		navBtn.setAttribute('aria-label', 'Открыть мобильное меню');
		menuIcon.classList.remove('nav-icon--active');
		document.body.classList.remove('no-scroll');
	};

	const openMobileNav = () => {
		nav.classList.add('mobile-nav--open');
		nav.setAttribute('aria-hidden', 'false');
		nav.inert = false;
		navBtn.setAttribute('aria-expanded', 'true');
		navBtn.setAttribute('aria-label', 'Закрыть мобильное меню');
		menuIcon.classList.add('nav-icon--active');
		document.body.classList.add('no-scroll');
	};

	nav.inert = true;

	navBtn.addEventListener('click', () => {
		if (nav.classList.contains('mobile-nav--open')) {
			closeMobileNav();
			return;
		}

		openMobileNav();
	});

	navLinks.forEach((link) => {
		link.addEventListener('click', closeMobileNav);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			closeMobileNav();
		}
	});

	window.addEventListener('resize', () => {
		if (window.innerWidth > getTabletBreakpoint()) {
			closeMobileNav();
		}
	});
}

export default mobileNav;
