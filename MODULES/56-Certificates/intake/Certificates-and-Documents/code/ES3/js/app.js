document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        themeToggle.addEventListener('click', function() {
            isDark = !isDark;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            themeToggle.textContent = isDark ? '◑' : '◐';
        });
    }
});

function animateCounters() {
    const numbers = document.querySelectorAll('.qs-number, .mini-number');
    numbers.forEach(el => {
        const text = el.textContent.trim();
        const target = parseInt(text.replace(/,/g, ''));
        if (isNaN(target)) return;

        let current = 0;
        const duration = 1500;
        const step = Math.max(1, Math.floor(target / 60));

        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current.toLocaleString();
        }, 20);
    });
}

setTimeout(animateCounters, 600);


document.addEventListener('click', function(e) {
    const toggle = e.target.closest('.toggle');
    if (toggle) {
        toggle.classList.toggle('on');
    }
});

console.log('%c✦ WisWits Premium Dashboard ✦', 'font-size:24px; font-weight:bold; color:#C8A04E;');
console.log('%cDesigned with ♥ for excellence', 'font-size:14px; color:#0F2147;');
console.log('%c🚀 Ready to generate certificates!', 'font-size:14px; color:#C8A04E;');


document.addEventListener('input', function(e) {
    if (e.target.closest('.search-wrapper input')) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Searching for:', searchTerm);
    }
});
