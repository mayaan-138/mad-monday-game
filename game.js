"// Game JS will go here" 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Player car properties
const car = {
  width: 60,
  height: 120,
  x: 0,
  y: 0,
  speed: 8
};

function resetCarPosition() {
  car.x = canvas.width / 2 - car.width / 2;
  car.y = canvas.height - car.height - 30;
}
window.addEventListener('resize', resetCarPosition);
resetCarPosition();

// Keyboard controls
let leftPressed = false;
let rightPressed = false;
let gameOver = false;
let carBlast = false;
let carBlastTimer = 0;

window.addEventListener('keydown', (e) => {
  if (gameOver) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = true;
  // Numpad 1-9 for firing bullets
  if (e.code.startsWith('Numpad')) {
    const num = parseInt(e.code.replace('Numpad', ''));
    if (num >= 1 && num <= 9) {
      fireBullets(num);
    }
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = false;
});

// Touch controls for mobile
canvas.addEventListener('touchstart', (e) => {
  const touchX = e.touches[0].clientX;
  if (touchX < canvas.width / 2) leftPressed = true;
  else rightPressed = true;
});
canvas.addEventListener('touchend', () => {
  leftPressed = false;
  rightPressed = false;
});

// Road properties
const road = {
  width: 400,
  color: '#888',
  laneLineColor: '#fff',
  laneLineWidth: 8,
  laneLineHeight: 40,
  laneLineGap: 30
};

// Bullet properties
const bullets = [];
const bulletSpeed = 15;
const bulletWidth = 10;
const bulletHeight = 30;

// Road animation
let roadOffset = 0;
const roadSpeed = 8;

// Obstacles
const obstacles = [];
const obstacleWidth = 60;
const obstacleHeight = 120;
let obstacleSpeed = 4; // Start slower
const obstacleSpeedStart = 4;
const obstacleSpeedMax = 18;
const obstacleSpeedIncrease = 0.01;
let obstacleSpawnTimer = 0;
const obstacleSpawnInterval = 60; // frames
let framesElapsed = 0;

// Bullet reload
let canFire = true;
let reloadTimer = 0;
const reloadInterval = 7; // frames

let score = 0;

// Create Play Again button
let playAgainBtn = document.createElement('button');
playAgainBtn.textContent = 'Play Again';
playAgainBtn.style.position = 'absolute';
playAgainBtn.style.left = '50%';
playAgainBtn.style.top = '60%';
playAgainBtn.style.transform = 'translate(-50%, -50%)';
playAgainBtn.style.padding = '20px 40px';
playAgainBtn.style.fontSize = '2rem';
playAgainBtn.style.display = 'none';
playAgainBtn.style.zIndex = '10';
document.body.appendChild(playAgainBtn);
playAgainBtn.onclick = () => {
  // Reset game state
  gameOver = false;
  carBlast = false;
  carBlastTimer = 0;
  obstacles.length = 0;
  bullets.length = 0;
  score = 0;
  canFire = true;
  reloadTimer = 0;
  resetCarPosition();
  playAgainBtn.style.display = 'none';
  framesElapsed = 0;
  obstacleSpeed = obstacleSpeedStart;
};

function fireBullets(count) {
  if (!canFire || gameOver) return;
  if (count !== 1 && count !== 2) return; // Only allow single and dual shot
  canFire = false;
  reloadTimer = reloadInterval;
  // Spread bullets horizontally, centered on the car
  const spacing = car.width / (count + 1);
  for (let i = 0; i < count; i++) {
    bullets.push({
      x: car.x + spacing * (i + 1) - bulletWidth / 2,
      y: car.y,
      width: bulletWidth,
      height: bulletHeight,
      angle: -Math.PI / 2 // always straight up
    });
  }
}

function update() {
  if (gameOver) {
    if (carBlast) carBlastTimer++;
    playAgainBtn.style.display = 'block';
    return;
  }
  framesElapsed++;
  // Gradually increase obstacle speed
  obstacleSpeed = Math.min(obstacleSpeedStart + framesElapsed * obstacleSpeedIncrease, obstacleSpeedMax);
  if (leftPressed) car.x -= car.speed;
  if (rightPressed) car.x += car.speed;
  // Keep car within road bounds
  const roadX = canvas.width / 2 - road.width / 2;
  car.x = Math.max(roadX, Math.min(roadX + road.width - car.width, car.x));

  // Update road animation
  roadOffset += roadSpeed;
  if (roadOffset > road.laneLineHeight + road.laneLineGap) {
    roadOffset = 0;
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += Math.sin(b.angle) * bulletSpeed;
    if (b.y + bulletHeight < 0 || b.x + bulletWidth < 0 || b.x > canvas.width) {
      bullets.splice(i, 1);
    }
  }

  // Update reload timer
  if (!canFire) {
    reloadTimer--;
    if (reloadTimer <= 0) {
      canFire = true;
    }
  }

  // Spawn obstacles
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer >= obstacleSpawnInterval) {
    obstacleSpawnTimer = 0;
    // Random lane
    const laneCount = 3;
    const lane = Math.floor(Math.random() * laneCount);
    const roadX = canvas.width / 2 - road.width / 2;
    const laneWidth = road.width / laneCount;
    obstacles.push({
      x: roadX + laneWidth * lane + laneWidth / 2 - obstacleWidth / 2,
      y: -obstacleHeight,
      width: obstacleWidth,
      height: obstacleHeight,
      hits: 0,
      blast: false,
      blastTimer: 0
    });
  }

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (!obs.blast) {
      obs.y += obstacleSpeed;
    } else {
      obs.blastTimer++;
      if (obs.blastTimer > 15) {
        obstacles.splice(i, 1);
        score++;
        continue;
      }
    }
    if (obs.y > canvas.height) {
      obstacles.splice(i, 1);
      continue;
    }
    // Bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (!obs.blast && b.x < obs.x + obs.width && b.x + bulletWidth > obs.x && b.y < obs.y + obs.height && b.y + bulletHeight > obs.y) {
        obs.hits++;
        bullets.splice(j, 1);
        if (obs.hits >= 3) {
          obs.blast = true;
          obs.blastTimer = 0;
        }
        break;
      }
    }
    // Car collision
    if (!obs.blast && !carBlast && car.x < obs.x + obs.width && car.x + car.width > obs.x && car.y < obs.y + obs.height && car.y + car.height > obs.y) {
      carBlast = true;
      carBlastTimer = 0;
      gameOver = true;
    }
  }
}

function drawRoad() {
  // Draw road
  const roadX = canvas.width / 2 - road.width / 2;
  ctx.fillStyle = road.color;
  ctx.fillRect(roadX, 0, road.width, canvas.height);
  // Draw lane lines (animated)
  ctx.fillStyle = road.laneLineColor;
  const laneCount = 3;
  for (let lane = 1; lane < laneCount; lane++) {
    const x = roadX + (road.width / laneCount) * lane;
    for (let y = -roadOffset; y < canvas.height; y += road.laneLineHeight + road.laneLineGap) {
      ctx.fillRect(x - road.laneLineWidth / 2, y, road.laneLineWidth, road.laneLineHeight);
    }
  }
}

function draw() {
  // Draw background
  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRoad();
  // Draw car
  if (carBlast) {
    ctx.save();
    ctx.globalAlpha = 1 - Math.min(carBlastTimer / 20, 1);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(car.x, car.y, car.width, car.height);
    ctx.globalAlpha = 1 - Math.max(0, (carBlastTimer - 10) / 10);
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(car.x + car.width / 2, car.y + car.height / 2, 80 * (1 + carBlastTimer / 20), 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(car.x, car.y, car.width, car.height);
  }
  // Draw obstacles
  for (const obs of obstacles) {
    if (obs.blast) {
      ctx.save();
      ctx.globalAlpha = 1 - obs.blastTimer / 15;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 60 * (1 + obs.blastTimer / 10), 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
  }
  // Draw bullets
  ctx.fillStyle = '#ffff00';
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
  // Draw reload bar
  if (!canFire) {
    const barWidth = 100;
    const barHeight = 10;
    const x = canvas.width - barWidth - 20;
    const y = 20;
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(x, y, barWidth * (1 - reloadTimer / reloadInterval), barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  // Draw Game Over
  if (gameOver) {
    ctx.save();
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
  // Draw score
  ctx.save();
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 30, 50);
  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop(); 
