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
    isMuted = !isMuted;
    bgm.muted = isMuted;
    updateSoundIcons();
}

if (soundToggle) soundToggle.addEventListener('click', toggleSound);
if (soundToggleMobile) soundToggleMobile.addEventListener('click', toggleSound);

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
