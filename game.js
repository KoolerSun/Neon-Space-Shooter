const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const WIDTH = 1400;
const HEIGHT = 600;
const NEON_GREEN = '#39ff14';
const NEON_RED = '#ff004d';
const NEON_CYAN = '#00ffff';
const NEON_YELLOW = '#ffff00';

// State
let lastTime = 0;
let enemies = [];
let particles = [];
let powerUps = []; 
let floatingTexts = []; 
let gameLevel = 1;
let levelTimer = 0; 

// Spawn Timers
let spawnTimerP1 = 0;
let spawnTimerP2 = 0;
let thresholdP1 = 120;
let thresholdP2 = 120;

// Inputs
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

class Player {
    constructor(isP2) {
        this.isP2 = isP2; 
        this.width = 30;
        this.height = 30;
        this.color = isP2 ? NEON_RED : NEON_GREEN;
        
        // Define Lanes strictly
        this.minX = isP2 ? WIDTH / 2 : 0;
        this.maxX = isP2 ? WIDTH : WIDTH / 2;
        
        // Start Position
        this.x = this.minX + (WIDTH/4) - (this.width/2);
        this.y = HEIGHT - 80;
        
        this.lives = 3;
        this.score = 0;
        this.speed = 7;
        this.bullets = [];
        this.lastShot = 0;
        this.attackMeter = 0; 
        this.isDead = false;

        this.hasShield = false;
        this.tripleShotTime = 0;
    }

    update(dt) {
        if (this.isDead) return;
        if (this.tripleShotTime > 0) this.tripleShotTime -= dt;

        // Movement
        if (!this.isP2) { // P1 WASD
            if (keys['KeyA'] && this.x > this.minX) this.x -= this.speed;
            if (keys['KeyD'] && this.x + this.width < this.maxX) this.x += this.speed;
            if (keys['KeyW'] && this.y > HEIGHT/2) this.y -= this.speed;
            if (keys['KeyS'] && this.y + this.height < HEIGHT) this.y += this.speed;
            if (keys['Space']) this.shoot();
        } else { // P2 ARROWS
            if (keys['ArrowLeft'] && this.x > this.minX) this.x -= this.speed;
            if (keys['ArrowRight'] && this.x + this.width < this.maxX) this.x += this.speed;
            if (keys['ArrowUp'] && this.y > HEIGHT/2) this.y -= this.speed;
            if (keys['ArrowDown'] && this.y + this.height < HEIGHT) this.y += this.speed;
            if (keys['Enter']) this.shoot();
        }

        // Bullets
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => !b.remove);
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot > 250) {
            this.bullets.push(new Bullet(this.x + this.width/2, this.y, -10));
            if (this.tripleShotTime > 0) {
                this.bullets.push(new Bullet(this.x, this.y + 10, -9, -2)); 
                this.bullets.push(new Bullet(this.x + this.width, this.y + 10, -9, 2)); 
            }
            this.lastShot = now;
        }
    }

    addScore(points) {
        this.score += points;
        this.attackMeter++;
        
        if (this.attackMeter >= 8) {
            this.attackMeter = 0;
            sendGarbage(!this.isP2); 
            // flash
            const flashX = this.isP2 ? (WIDTH * 0.75) : (WIDTH * 0.25);
            spawnExplosion(flashX, 100, this.isP2 ? NEON_RED : NEON_GREEN, 20); 
        }
        updateUI();
    }

    takeDamage(sourceType) {
        if (this.hasShield) {
            this.hasShield = false; 
            spawnExplosion(this.x + 15, this.y + 15, NEON_YELLOW, 10); 
            spawnFloatingText(this.x, this.y - 20, "BLOCKED", NEON_YELLOW);
            return;
        }

        if (this.lives > 0) {
            this.lives--;
            spawnFloatingText(this.x + 15, this.y - 20, "CRASH!", "#ff0000");
            spawnExplosion(this.x + 15, this.y + 15, this.color, 30);
            updateUI();
        }
        
        if (this.lives <= 0) {
            this.isDead = true;
            checkGameOver();
        } else {
            // Respawn
            enemies.forEach(e => {
                if (e.laneP2 === this.isP2 && Math.abs(e.y - this.y) < 300) {
                    e.remove = true;
                    spawnExplosion(e.x, e.y, '#fff', 5);
                }
            });
            this.x = this.minX + (WIDTH/4) - (this.width/2);
            this.y = HEIGHT - 80;
            this.hasShield = true; 
            setTimeout(() => this.hasShield = false, 2000);
        }
    }

    draw() {
        if (this.isDead) return;
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Ship
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.fill();
        
        // Shield
        if (this.hasShield) {
            ctx.strokeStyle = NEON_YELLOW;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 25, 0, Math.PI*2);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        this.bullets.forEach(b => b.draw());
    }
}

class Bullet {
    constructor(x, y, vy, vx = 0) {
        this.x = x; this.y = y; this.vy = vy; this.vx = vx;
        this.width = 4; this.height = 10;
        this.remove = false;
    }
    update() {
        this.y += this.vy;
        this.x += this.vx;
        if (this.y < 0) this.remove = true;
    }
    draw() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 2, this.y, this.width, this.height);
    }
}

class Enemy {
    constructor(laneP2, isGarbage = false) {
        this.laneP2 = laneP2; 
        this.isGarbage = isGarbage;
        
        const minX = laneP2 ? WIDTH/2 : 0;
        this.width = isGarbage ? 40 : 25;
        this.height = isGarbage ? 40 : 25;
        
        // spawn random
        this.x = minX + 20 + Math.random() * ((WIDTH/2) - 80);
        this.y = -50;
        
        // speed
        let speedMultiplier = 1 + (gameLevel * 0.10); 
        if (isGarbage) {
            this.vy = 0.6 * speedMultiplier; 
        } else {
            this.vy = (0.4 + Math.random() * 0.8) * speedMultiplier;
        }

        this.hp = isGarbage ? 2 : 1;
        this.color = isGarbage ? '#fff' : (laneP2 ? '#ffaaaa' : '#aaffaa');
        this.remove = false;
    }
    
    update() {
        this.y += this.vy;
        
        if (this.y > HEIGHT) {
            this.remove = true;
        }
    }

    draw() {
        ctx.fillStyle = this.isGarbage ? '#fff' : this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        if (this.isGarbage) {
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.shadowBlur = 0;
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x; this.y = y; this.vy = 2; 
        this.radius = 15;
        this.remove = false;
        
        const rand = Math.random();
        if (rand < 0.4) this.type = 'TRIPLE';
        else if (rand < 0.8) this.type = 'SHIELD';
        else this.type = 'HEAL';
        
        this.color = this.type === 'TRIPLE' ? NEON_CYAN : (this.type === 'SHIELD' ? NEON_YELLOW : '#ff69b4'); 
    }
    update() {
        this.y += this.vy;
        if (this.y > HEIGHT) this.remove = true;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let label = this.type === 'TRIPLE' ? 'T' : (this.type === 'SHIELD' ? 'S' : 'H');
        ctx.fillText(label, this.x, this.y);
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = 1.0;
        this.vy = -1;
    }
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Arial';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= 0.05;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

let p1, p2;
let gameActive = false;

function startGame() {
    p1 = new Player(false); 
    p2 = new Player(true); 
    enemies = [];
    particles = [];
    powerUps = [];
    floatingTexts = [];
    
    gameLevel = 1;
    levelTimer = 0;
    
    spawnTimerP1 = Math.random() * 50;
    spawnTimerP2 = Math.random() * 50;
    thresholdP1 = 120;
    thresholdP2 = 120;
    
    gameActive = true;
    document.getElementById('menu').style.display = 'none';
    updateUI();
    lastTime = Date.now();
    gameLoop();
}

function sendGarbage(targetIsP2) {
    enemies.push(new Enemy(targetIsP2, true));
}

function spawnExplosion(x, y, color, count=10) {
    for(let i=0; i<count; i++) particles.push(new Particle(x, y, color));
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push(new FloatingText(x, y, text, color));
}

function spawnPowerUp(x, y) {
    if (Math.random() < 0.10) {
        powerUps.push(new PowerUp(x, y));
    }
}

function checkHit(rect1, rect2) {
    let r1w = rect1.radius ? rect1.radius*2 : rect1.width;
    let r1h = rect1.radius ? rect1.radius*2 : rect1.height;
    let r1x = rect1.radius ? rect1.x - rect1.radius : rect1.x;
    let r1y = rect1.radius ? rect1.y - rect1.radius : rect1.y;

    return r1x < rect2.x + rect2.width && r1x + r1w > rect2.x &&
           r1y < rect2.y + rect2.height && r1y + r1h > rect2.y;
}

// p1 / p2 Functions
function checkP1Collisions(e) {
    if (!p1.isDead && checkHit(e, p1)) {
        e.remove = true;
        p1.takeDamage('hit'); 
    }
    p1.bullets.forEach(b => {
        if (!b.remove && !e.remove && checkHit(b, e)) {
            b.remove = true;
            e.hp--;
            if (e.hp <= 0) {
                e.remove = true;
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, e.color);
                p1.addScore(e.isGarbage ? 50 : 10);
                spawnPowerUp(e.x + e.width/2, e.y);
            } else {
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, '#fff', 2);
            }
        }
    });
}

function checkP2Collisions(e) {
    if (!p2.isDead && checkHit(e, p2)) {
        e.remove = true;
        p2.takeDamage('hit'); 
    }
    p2.bullets.forEach(b => {
        if (!b.remove && !e.remove && checkHit(b, e)) {
            b.remove = true;
            e.hp--;
            if (e.hp <= 0) {
                e.remove = true;
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, e.color);
                p2.addScore(e.isGarbage ? 50 : 10);
                spawnPowerUp(e.x + e.width/2, e.y);
            } else {
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, '#fff', 2);
            }
        }
    });
}

function checkCollisions() {
    enemies.forEach(e => {
        if (e.remove) return;
        if (e.laneP2) { 
            checkP2Collisions(e);
        } else {
            checkP1Collisions(e);
        }
    });

    powerUps.forEach(p => {
        if (p.remove) return;
        [p1, p2].forEach(player => {
            if (!player.isDead && checkHit(p, player)) {
                p.remove = true;
                if (p.type === 'TRIPLE') player.tripleShotTime = 5000; 
                if (p.type === 'SHIELD') player.hasShield = true;
                if (p.type === 'HEAL') player.lives = Math.min(player.lives + 1, 5); 
                updateUI();
                spawnFloatingText(p.x, p.y, p.type, "#fff");
                spawnExplosion(p.x, p.y, p.color, 5);
            }
        });
    });
}

function checkGameOver() {
    if (p1.isDead && p2.isDead) {
        gameActive = false;
        setTimeout(() => {
            document.getElementById('menu').style.display = 'block';
            document.querySelector('#menu h1').innerText = "GAME OVER";
            
            let winnerText = "DRAW";
            if (p1.score > p2.score) winnerText = "P1 WINS ON SCORE";
            if (p2.score > p1.score) winnerText = "P2 WINS ON SCORE";
            
            document.querySelector('#menu p').innerText = winnerText;
            document.querySelector('#menu button').innerText = "REMATCH";
        }, 1000);
    }
}

function updateUI() {
    document.getElementById('p1-score').innerText = p1.score;
    document.getElementById('p2-score').innerText = p2.score;
    document.getElementById('p1-lives').innerText = p1.lives;
    document.getElementById('p2-lives').innerText = p2.lives;
    document.getElementById('p1-meter').innerText = p1.attackMeter;
    document.getElementById('p2-meter').innerText = p2.attackMeter;
    document.getElementById('level-display').innerText = gameLevel;
}

function gameLoop() {
    if (!gameActive) return;

    const now = Date.now();
    const dt = now - lastTime;
    lastTime = now;

    levelTimer += dt;
    if (levelTimer > 15000) { 
        gameLevel++;
        levelTimer = 0;
        thresholdP1 = Math.max(20, thresholdP1 - 5);
        thresholdP2 = Math.max(20, thresholdP2 - 5);
        updateUI(); 
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = '#fff';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(WIDTH/2, 0);
    ctx.lineTo(WIDTH/2, HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // p1 / p2 Enemy Spawning
    spawnTimerP1++;
    if (spawnTimerP1 > thresholdP1) {
        if (!p1.isDead) enemies.push(new Enemy(false)); 
        spawnTimerP1 = Math.floor(Math.random() * 20); 
    }

    spawnTimerP2++;
    if (spawnTimerP2 > thresholdP2) {
        if (!p2.isDead) enemies.push(new Enemy(true)); 
        spawnTimerP2 = Math.floor(Math.random() * 20); 
    }

    p1.update(dt); p1.draw();
    p2.update(dt); p2.draw();
    
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => !e.remove);

    powerUps.forEach(p => { p.update(); p.draw(); });
    powerUps = powerUps.filter(p => !p.remove);
    
    particles.forEach((p, i) => {
        p.update(); p.draw();
        if(p.life <= 0) particles.splice(i, 1);
    });

    floatingTexts.forEach((t, i) => {
        t.update(); t.draw();
        if(t.life <= 0) floatingTexts.splice(i, 1);
    });

    checkCollisions();
    requestAnimationFrame(gameLoop);
}