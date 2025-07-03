const MOVE_SPEED = 2;
const GRAVITY = 1;
const JUMP_SPEED = -15;
const KNOCKBACK_DISTANCE = 50;
const KNOCKBACK_STEPS = 10;
let movementIntervals = {};
let velocities = {
    Character1: { vy: 0, grounded: false },
    Character2: { vy: 0, grounded: false }
};
let canAttack = {
    Character1: true,
    Character2: true
};
let canMoveLR = {
    Character1: true,
    Character2: true
};
let scores = {
    Character1: 0,
    Character2: 0
};

window.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#Character1_DamageAnimnation img").style.display = "none";
    document.querySelector("#Character2_DamageAnimnation img").style.display = "none";
    updateScores();
});

function updateScores() {
    document.getElementById("ScoreBox1").textContent = scores.Character1;
    document.getElementById("ScoreBox2").textContent = scores.Character2;
}

function moveElement(id, dx, dy, override = false) {
    const characterKey = id.includes('Character1') ? 'Character1' : 'Character2';
    if (dx !== 0 && !canMoveLR[characterKey] && !override) return;

    const mainBox = document.getElementById(id);
    const boundary = document.getElementById(id.replace('MainBox', 'MovementBoundary'));

    const boundaryRect = boundary.getBoundingClientRect();
    const newCenterX = boundaryRect.left + boundaryRect.width / 2 + dx;
    const newCenterY = boundaryRect.top + boundaryRect.height / 2 + dy;

    const halfW = boundary.offsetWidth / 2;
    const halfH = boundary.offsetHeight / 2;

    const futureBoundary = {
        left: newCenterX - halfW,
        right: newCenterX + halfW,
        top: newCenterY - halfH,
        bottom: newCenterY + halfH
    };

    const otherId = id.includes('Character1') ? 'Character2_MovementBoundary' : 'Character1_MovementBoundary';
    const otherRect = document.getElementById(otherId).getBoundingClientRect();

    const otherBox = {
        left: otherRect.left,
        right: otherRect.right,
        top: otherRect.top,
        bottom: otherRect.bottom
    };

    if (isWithinBounds(futureBoundary) && !rectsOverlap(futureBoundary, otherBox)) {
        const currentLeft = parseFloat(mainBox.style.left || 0);
        const currentTop = parseFloat(mainBox.style.top || 0);
        mainBox.style.left = `${currentLeft + dx}px`;
        mainBox.style.top = `${currentTop + dy}px`;
    }
}

function rectsOverlap(a, b) {
    return (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
    );
}

function isWithinBounds(boundary) {
    const walls = ['BorderA', 'BorderC', 'BorderD', 'BorderE'].map(id =>
        document.getElementById(id).getBoundingClientRect()
    );
    return walls.every(wall => !rectsOverlap(boundary, wall));
}

function applyGravity(characterKey) {
    const mainBox = document.getElementById(characterKey + '_MainBox');
    const boundary = document.getElementById(characterKey + '_MovementBoundary');
    const vel = velocities[characterKey];

    const boundaryRect = boundary.getBoundingClientRect();
    const newCenterY = boundaryRect.top + boundary.offsetHeight / 2 + vel.vy;

    const futureBoundary = {
        left: boundaryRect.left,
        right: boundaryRect.right,
        top: newCenterY - boundary.offsetHeight / 2,
        bottom: newCenterY + boundary.offsetHeight / 2
    };

    const otherKey = characterKey === 'Character1' ? 'Character2' : 'Character1';
    const otherRect = document.getElementById(otherKey + '_MovementBoundary').getBoundingClientRect();
    const otherBox = {
        left: otherRect.left,
        right: otherRect.right,
        top: otherRect.top,
        bottom: otherRect.bottom
    };

    if (isWithinBounds(futureBoundary) && !rectsOverlap(futureBoundary, otherBox)) {
        const currentTop = parseFloat(mainBox.style.top || 0);
        mainBox.style.top = `${currentTop + vel.vy}px`;
        vel.vy += GRAVITY;
        vel.grounded = false;
    } else {
        vel.vy = 0;
        vel.grounded = true;
    }
}

setInterval(() => {
    applyGravity('Character1');
    applyGravity('Character2');
}, 16);

function startMovement(buttonId, elementId, dx, dy) {
    if (movementIntervals[buttonId]) return;
    movementIntervals[buttonId] = setInterval(() => {
        moveElement(elementId, dx, dy);
    }, 16);
}

function stopMovement(buttonId) {
    clearInterval(movementIntervals[buttonId]);
    delete movementIntervals[buttonId];
}

const buttonMappings = {
    'Character1_Button1': { elementId: 'Character1_MainBox', dx: -MOVE_SPEED, dy: 0 },
    'Character1_Button3': { elementId: 'Character1_MainBox', dx: MOVE_SPEED, dy: 0 },
    'Character1_Button4': { elementId: 'Character1_MainBox', dx: 0, dy: MOVE_SPEED },
    'Character2_Button1': { elementId: 'Character2_MainBox', dx: -MOVE_SPEED, dy: 0 },
    'Character2_Button3': { elementId: 'Character2_MainBox', dx: MOVE_SPEED, dy: 0 },
    'Character2_Button4': { elementId: 'Character2_MainBox', dx: 0, dy: MOVE_SPEED }
};

Object.entries(buttonMappings).forEach(([buttonId, { elementId, dx, dy }]) => {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('mousedown', () => startMovement(buttonId, elementId, dx, dy));
    btn.addEventListener('mouseup', () => stopMovement(buttonId));
    btn.addEventListener('mouseleave', () => stopMovement(buttonId));
});
document.addEventListener('mouseup', () => {
    Object.keys(movementIntervals).forEach(stopMovement);
});

document.getElementById('Character1_Button2').addEventListener('mousedown', () => {
    if (canMoveLR.Character1 && velocities.Character1.grounded) velocities.Character1.vy = JUMP_SPEED;
});
document.getElementById('Character2_Button2').addEventListener('mousedown', () => {
    if (canMoveLR.Character2 && velocities.Character2.grounded) velocities.Character2.vy = JUMP_SPEED;
});

function performAttackAnimation(characterKey) {
    const mainImg = document.querySelector(`#${characterKey}_MainBox img`);
    const originalSrc = mainImg.src;
    mainImg.src = "https://i.postimg.cc/R0Vy34bK/punch-1-T.gif";
    canMoveLR[characterKey] = false;
    setTimeout(() => {
        mainImg.src = originalSrc;
        canMoveLR[characterKey] = true;
    }, 800);
}

function performDamage(defender, attacker) {
    const damageGIF = document.querySelector(`#${defender}_DamageAnimnation img`);
    const defenderImg = document.querySelector(`#${defender}_MainBox img`);
    damageGIF.style.display = "block";
    defenderImg.style.visibility = "hidden";
    canMoveLR[defender] = false;

    const direction = attacker === 'Character1' ? 1 : -1;
    const step = (KNOCKBACK_DISTANCE / KNOCKBACK_STEPS) * direction;
    let count = 0;
    const knockbackInterval = setInterval(() => {
        if (count >= KNOCKBACK_STEPS) return clearInterval(knockbackInterval);
        moveElement(`${defender}_MainBox`, step, 0, true);
        count++;
    }, 20);

    setTimeout(() => {
        damageGIF.style.display = "none";
        defenderImg.style.visibility = "visible";
        canMoveLR[defender] = true;
    }, 800);
}

function triggerAttack(attacker, defender) {
    if (!canAttack[attacker] || !canMoveLR[attacker]) return;
    canAttack[attacker] = false;
    performAttackAnimation(attacker);

    const attackRect = document.getElementById(`${attacker}_AttackBoundary`).getBoundingClientRect();
    const defenseRect = document.getElementById(`${defender}_MovementBoundary`).getBoundingClientRect();

    if (rectsOverlap(attackRect, defenseRect)) {
        const damageGIF = document.querySelector(`#${defender}_DamageAnimnation img`);
        if (damageGIF.style.display !== "block") {
            performDamage(defender, attacker);
            scores[attacker]++;
            updateScores();
        }
    }

    setTimeout(() => {
        canAttack[attacker] = true;
    }, 800);
}

// Attack button events
document.getElementById('Character1_Button5').addEventListener('click', () => {
    triggerAttack('Character1', 'Character2');
});
document.getElementById('Character2_Button5').addEventListener('click', () => {
    triggerAttack('Character2', 'Character1');
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyA': document.getElementById('Character1_Button1').dispatchEvent(new Event('mousedown')); break;
        case 'KeyD': document.getElementById('Character1_Button3').dispatchEvent(new Event('mousedown')); break;
        case 'KeyS': document.getElementById('Character1_Button4').dispatchEvent(new Event('mousedown')); break;
        case 'KeyW': document.getElementById('Character1_Button2').dispatchEvent(new Event('mousedown')); break;
        case 'ArrowLeft': document.getElementById('Character2_Button1').dispatchEvent(new Event('mousedown')); break;
        case 'ArrowRight': document.getElementById('Character2_Button3').dispatchEvent(new Event('mousedown')); break;
        case 'ArrowDown': document.getElementById('Character2_Button4').dispatchEvent(new Event('mousedown')); break;
        case 'ArrowUp': document.getElementById('Character2_Button2').dispatchEvent(new Event('mousedown')); break;
        case 'ShiftLeft': triggerAttack('Character1', 'Character2'); break;
        case 'ShiftRight': triggerAttack('Character2', 'Character1'); break;
        case 'Space': respawnCharacters(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyA': stopMovement('Character1_Button1'); break;
        case 'KeyD': stopMovement('Character1_Button3'); break;
        case 'KeyS': stopMovement('Character1_Button4'); break;
        case 'ArrowLeft': stopMovement('Character2_Button1'); break;
        case 'ArrowRight': stopMovement('Character2_Button3'); break;
        case 'ArrowDown': stopMovement('Character2_Button4'); break;
    }
});

function centerMainBoxByInnerBoundary(mainBox, boundary, spawnZone) {
    const spawnRect = spawnZone.getBoundingClientRect();
    const boundaryRect = boundary.getBoundingClientRect();
    const dx = (spawnRect.left + spawnRect.width / 2) - (boundaryRect.left + boundaryRect.width / 2);
    const dy = (spawnRect.top + spawnRect.height / 2) - (boundaryRect.top + boundaryRect.height / 2);
    const left = parseFloat(mainBox.style.left || 0);
    const top = parseFloat(mainBox.style.top || 0);
    mainBox.style.left = `${left + dx}px`;
    mainBox.style.top = `${top + dy}px`;
}

function respawnCharacters() {
    ['Character1', 'Character2'].forEach(char => {
        const box = document.getElementById(`${char}_MainBox`);
        const boundary = document.getElementById(`${char}_MovementBoundary`);
        const spawn = document.getElementById(`SpawnZone${char === 'Character1' ? '1' : '2'}`);
        box.style.left = "0px";
        box.style.top = "0px";
        velocities[char] = { vy: 0, grounded: false };
        canAttack[char] = true;
        canMoveLR[char] = true;
        const damageGif = document.querySelector(`#${char}_DamageAnimnation img`);
        const charImg = document.querySelector(`#${char}_MainBox img`);
        damageGif.style.display = 'none';
        charImg.style.visibility = 'visible';
        requestAnimationFrame(() => centerMainBoxByInnerBoundary(box, boundary, spawn));
    });
    scores.Character1 = 0;
    scores.Character2 = 0;
    updateScores();
}

document.getElementById('ResetButton').addEventListener('click', () => {
    respawnCharacters();
});

window.addEventListener('load', respawnCharacters);
