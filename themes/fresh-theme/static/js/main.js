// ============================================
// Natural Selection Navigation System
// 自然选择号星舰控制系统
// ============================================

// Starfield Animation - 星空动画
class Starfield {
    constructor() {
        this.canvas = document.getElementById('starfield');
        if (!this.canvas) {
            console.log('[Starfield] Canvas not found, skipping animation');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.hyperspace = false;
        this.speed = 0.5;
        this.baseSpeed = 0.5;
        this.maxSpeed = 15;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createStars();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
        
        // Click quote to activate hyperspace
        const quote = document.querySelector('.hero__quote');
        if (quote) {
            quote.style.cursor = 'pointer';
            quote.addEventListener('click', () => this.toggleHyperspace());
        }
    }
    
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createStars() {
        if (!this.canvas) return;
        const count = Math.floor((this.canvas.width * this.canvas.height) / 3000);
        this.stars = [];
        
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 2 + 0.5,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    toggleHyperspace() {
        this.hyperspace = !this.hyperspace;
        
        const hint = this.hyperspace ? '前进四！超光速引擎启动！' : '退出超光速，巡航模式';
        showToast(hint);
        
        document.body.classList.toggle('hyperspace', this.hyperspace);
    }
    
    animate() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.fillStyle = 'rgba(5, 5, 8, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const targetSpeed = this.hyperspace ? this.maxSpeed : this.baseSpeed;
        this.speed += (targetSpeed - this.speed) * 0.05;
        
        this.stars.forEach(star => {
            star.y += this.speed * star.z;
            star.twinkle += 0.02;
            
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
            
            const twinkleOpacity = star.opacity * (0.7 + 0.3 * Math.sin(star.twinkle));
            
            if (this.speed > 5) {
                const trailLength = (this.speed - 5) * star.z * 2;
                const gradient = this.ctx.createLinearGradient(
                    star.x, star.y - trailLength,
                    star.x, star.y
                );
                
                gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
                gradient.addColorStop(0.5, `rgba(0, 212, 255, ${twinkleOpacity * 0.3})`);
                gradient.addColorStop(1, `rgba(0, 212, 255, ${twinkleOpacity})`);
                
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                this.ctx.lineTo(star.x, star.y - trailLength);
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = star.size;
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
                this.ctx.fill();
                
                if (star.size > 1) {
                    this.ctx.beginPath();
                    this.ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(0, 212, 255, ${twinkleOpacity * 0.2})`;
                    this.ctx.fill();
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Mobile Navigation
function toggleNav() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

document.addEventListener('click', function(event) {
    const nav = document.querySelector('.nav');
    const navMenu = document.getElementById('navMenu');
    const toggle = document.querySelector('.nav__toggle');
    
    if (nav && navMenu && toggle) {
        if (!nav.contains(event.target) && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
});

// Copy functions
function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(function() {
        showToast('链接已复制到剪贴板');
    }).catch(function() {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('链接已复制到剪贴板');
    });
}

function copyPrompt() {
    const codeBlock = document.querySelector('.prompt-detail__content pre code, .prompt-detail__content code');
    
    if (codeBlock) {
        const content = codeBlock.textContent;
        navigator.clipboard.writeText(content).then(function() {
            showCopyHint();
        }).catch(function() {
            const textArea = document.createElement('textarea');
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyHint();
        });
    }
}

function showCopyHint() {
    const hint = document.getElementById('copyHint');
    if (hint) {
        hint.classList.add('show');
        setTimeout(function() {
            hint.classList.remove('show');
        }, 2000);
    }
}

// Search
function searchPrompts() {
    const searchInput = document.getElementById('promptSearch');
    const promptGrid = document.getElementById('promptGrid');
    
    if (!searchInput || !promptGrid) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const cards = promptGrid.querySelectorAll('.prompt-card');
    
    cards.forEach(function(card) {
        const title = card.querySelector('.prompt-card__title');
        const desc = card.querySelector('.prompt-card__desc');
        
        if (title && desc) {
            const titleText = title.textContent.toLowerCase();
            const descText = desc.textContent.toLowerCase();
            
            if (titleText.includes(searchTerm) || descText.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Toast notification
function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(0, 212, 255, 0.9);
        color: #050508;
        padding: 16px 32px;
        border-radius: 8px;
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 1px;
        z-index: 1000;
        opacity: 0;
        transition: all 300ms ease;
        box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 2500);
}

// Smooth scroll
document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="#"]');
    if (target) {
        const id = target.getAttribute('href').slice(1);
        const element = document.getElementById(id);
        if (element) {
            e.preventDefault();
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Reading progress
function initReadingProgress() {
    const article = document.querySelector('.article, .prompt-detail');
    if (!article) return;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    new Starfield();
    initReadingProgress();
    
    console.log('%cNatural Selection Navigation System Online', 'color: #00d4ff; font-size: 20px; font-weight: bold;');
    console.log('%c点击"自然选择，前进四！"激活超光速模式', 'color: #6b7280; font-size: 11px;');
});
