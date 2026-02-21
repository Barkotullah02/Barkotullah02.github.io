// Background Animation - Digital Grid & Particles
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const mouse = { x: null, y: null, radius: 150 };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.color = Math.random() > 0.5 ? '#00f2ff' : '#7000ff';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (!distance) return;
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            }
        }
    }
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    const particleCount = prefersReducedMotion ? 40 : 150;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    if (prefersReducedMotion) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    particles.forEach(p => {
        p.draw();
        p.update();
    });
    connect();
    requestAnimationFrame(animate);
}

function connect() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.strokeStyle = particles[a].color;
                ctx.globalAlpha = 1 - (distance / 100);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;
}

window.addEventListener('resize', init);
init();
animate();

// Mobile Menu Toggle
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Audio Logic
const bgm = document.getElementById('bgm');
const soundToggle = document.getElementById('sound-toggle');
const soundToggleMobile = document.getElementById('sound-toggle-mobile');
let isPlaying = false;
let isMuted = false;

function updateSoundIcons() {
    const iconClass = isMuted ? 'fa-volume-mute' : 'fa-volume-up';
    if (soundToggle) soundToggle.innerHTML = `<i class="fas ${iconClass} text-xl"></i>`;
    if (soundToggleMobile) soundToggleMobile.innerHTML = `<i class="fas ${iconClass}"></i> SOUND`;
}

function toggleSound() {
    if (!bgm) return;
    isMuted = !isMuted;
    bgm.muted = isMuted;
    updateSoundIcons();
}

if (soundToggle) soundToggle.addEventListener('click', toggleSound);
if (soundToggleMobile) soundToggleMobile.addEventListener('click', toggleSound);

if (bgm) {
    document.body.addEventListener('mouseenter', () => {
        if (!isPlaying && !isMuted) {
            bgm.play().then(() => {
                isPlaying = true;
            }).catch(err => {
                console.log("Interaction needed for audio");
            });
        }
    });

    document.addEventListener('click', () => {
        if (!isPlaying && !isMuted) {
            bgm.play();
            isPlaying = true;
        }
    }, { once: true });
}

function generatePostsTableOfContents() {
    const postsSection = document.getElementById('posts');
    const tocMount = document.getElementById('posts-toc');

    if (!postsSection || !tocMount) {
        return;
    }

    const articleNodes = Array.from(postsSection.querySelectorAll('article[id]'));

    if (!articleNodes.length) {
        tocMount.innerHTML = '';
        return;
    }

    const items = articleNodes
        .map((article, index) => {
            const titleText = article.querySelector('h3')?.textContent?.trim() || article.id;
            const timeElement = article.querySelector('time[datetime]');
            const dateText = timeElement?.getAttribute('datetime')?.trim() || '';
            const timestamp = Date.parse(dateText);

            return {
                id: article.id,
                title: titleText,
                dateLabel: dateText,
                timestamp: Number.isNaN(timestamp) ? null : timestamp,
                sourceIndex: index
            };
        })
        .sort((left, right) => {
            if (left.timestamp !== null && right.timestamp !== null) {
                return right.timestamp - left.timestamp;
            }

            if (left.timestamp !== null) {
                return -1;
            }

            if (right.timestamp !== null) {
                return 1;
            }

            return left.sourceIndex - right.sourceIndex;
        });

    const nav = document.createElement('nav');
    nav.className = 'section-card p-6 rounded-lg';
    nav.setAttribute('aria-label', 'Table of contents for Dev Daily articles');

    const title = document.createElement('h3');
    title.className = 'font-gaming text-2xl text-cyan-400 mb-2';
    title.textContent = 'Table of Contents';

    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-400 mb-4';
    subtitle.textContent = 'Auto-generated from article cards below.';

    const list = document.createElement('ol');
    list.className = 'space-y-2';

    items.forEach((item) => {
        const listItem = document.createElement('li');

        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.className = 'flex flex-wrap items-center gap-2 text-gray-200 hover:text-cyan-400 transition';

        const postTitle = document.createElement('span');
        postTitle.className = 'font-medium';
        postTitle.textContent = item.title;

        const postDate = document.createElement('span');
        postDate.className = 'text-xs px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-cyan-300';
        postDate.textContent = item.dateLabel || 'No date';

        link.appendChild(postTitle);
        link.appendChild(postDate);
        listItem.appendChild(link);
        list.appendChild(listItem);
    });

    nav.appendChild(title);
    nav.appendChild(subtitle);
    nav.appendChild(list);

    tocMount.innerHTML = '';
    tocMount.appendChild(nav);
}

function addBackToTocLinks() {
    const postsSection = document.getElementById('posts');
    const tocAnchorId = 'posts-toc';

    if (!postsSection || !document.getElementById(tocAnchorId)) {
        return;
    }

    const articleNodes = Array.from(postsSection.querySelectorAll('article[id]'));

    articleNodes.forEach((article) => {
        if (article.querySelector('.back-to-toc')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'mt-6';

        const link = document.createElement('a');
        link.href = '#posts-toc';
        link.className = 'back-to-toc inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-400 transition font-gaming text-sm';
        link.setAttribute('aria-label', 'Back to table of contents');
        link.textContent = '↑ Back to TOC';

        wrapper.appendChild(link);
        article.appendChild(wrapper);
    });
}

function addMobileStickyTocButton() {
    const postsSection = document.getElementById('posts');
    const tocAnchor = document.getElementById('posts-toc');

    if (!postsSection || !tocAnchor) {
        return;
    }

    const existingButton = document.getElementById('mobile-toc-button');
    if (existingButton) {
        existingButton.remove();
    }

    const button = document.createElement('a');
    button.id = 'mobile-toc-button';
    button.href = '#posts-toc';
    button.className = 'fixed bottom-5 right-5 z-50 md:hidden px-4 py-2 rounded-full border border-cyan-500/60 bg-black/80 text-cyan-300 font-gaming text-xs backdrop-blur-sm shadow-lg shadow-cyan-900/40 transition opacity-0 pointer-events-none';
    button.setAttribute('aria-label', 'Jump to table of contents');
    button.textContent = '↑ TOC';

    document.body.appendChild(button);

    const updateVisibility = () => {
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        const show = isMobile && window.scrollY > 260;

        button.classList.toggle('opacity-0', !show);
        button.classList.toggle('pointer-events-none', !show);
        button.classList.toggle('opacity-100', show);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
}

generatePostsTableOfContents();
addBackToTocLinks();
addMobileStickyTocButton();

// Scroll Reveal Effect
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    section.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-10');
    if (prefersReducedMotion) {
        section.classList.remove('opacity-0', 'translate-y-10');
        section.classList.add('opacity-100', 'translate-y-0');
        return;
    }
    observer.observe(section);
});
