import "./style.css";
import * as THREE from "three";
import { buildPlayerCar, spinWheels } from "./playerCar.js";
import { buildWorld } from "./world.js";
import { createControls } from "./controls.js";
import { createChaseCamera } from "./cameraRig.js";
import { SPEED_MIN, WORLD_SCROLL_DIR } from "./constants.js";
import { createHUD } from "./hud.js";
import { createSpawner } from "./spawner.js";
import { createClouds } from "./clouds.js";

// Canvas
const canvas = document.getElementById("canvas");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

// Camera
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(4, 4, 8);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 4);
scene.add(dir);

// World (road, grass, lane markers)
const world = buildWorld(scene);
// initialize segment positions (A at 0, B one segment ahead along direction)
const L = world.length;
world.roadA.position.z = 0;
world.roadB.position.z = L * WORLD_SCROLL_DIR;
world.grassLA.position.z = 0;
world.grassLB.position.z = L * WORLD_SCROLL_DIR;
world.grassRA.position.z = 0;
world.grassRB.position.z = L * WORLD_SCROLL_DIR;
world.markersA.position.z = 0;
world.markersB.position.z = L * WORLD_SCROLL_DIR;

// Player car
const { group: player, wheels: playerWheels } = buildPlayerCar();
scene.add(player);
player.position.set(0, 0, 10); // start near bottom of view

// Controls & camera rig
const controls = createControls();
const chase = createChaseCamera(camera, player, {
    offset: new THREE.Vector3(0, 5.5, 12),
    lookOffset: new THREE.Vector3(0, 1.0, -6),
    lerp: 5.0,
});

// HUD and simple game state
const hud = createHUD();
let isGameOver = false;
let score = 0; // event-based score (enemies passed)

// Enemies spawner
const spawner = createSpawner(scene);

// Sky clouds
const clouds = createClouds(scene, {
    count: 14,
    xRange: { min: -140, max: 140 },
    yRange: { min: 12, max: 26 },
    zRange: { min: -160, max: 60 },
    baseSpeed: 2.2,
});

// Collision helpers
const playerBox = new THREE.Box3();
const enemyBox = new THREE.Box3();

// Resize handling
function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener("resize", onResize);

// Render loop
let last = performance.now();
let phase = 0; // 0..L scroll phase independent of direction
function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    if (isGameOver) {
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
        return;
    }

    // Update controls/state
    const { speed } = controls.update(dt, player);
    hud.setSpeed(speed);

    // HUD score displays current event-based score
    // (updated when enemies pass the player below)
    // hud.setTime(score); // kept in restart and on pass events

    // Advance phase and position segments based on WORLD_SCROLL_DIR
    phase = (phase + speed * dt) % L;
    const aZ = -phase * WORLD_SCROLL_DIR;
    const bZ = aZ + L * WORLD_SCROLL_DIR;

    world.roadA.position.z = aZ;
    world.roadB.position.z = bZ;
    world.grassLA.position.z = aZ;
    world.grassLB.position.z = bZ;
    world.grassRA.position.z = aZ;
    world.grassRB.position.z = bZ;
    world.markersA.position.z = aZ;
    world.markersB.position.z = bZ;

    // Spin wheels according to speed and direction (reverse flips spin)
    spinWheels(playerWheels, speed * WORLD_SCROLL_DIR, dt);

    // Update enemies
    spawner.update(dt, player, speed, L, WORLD_SCROLL_DIR);

    // Update clouds (slight parallax with player speed)
    clouds.update(dt, speed);

    // Award score when enemies pass the player
    spawner.forEachActive(e => {
        if (e.scored) return;
        const pz = player.position.z;
        const ez = e.mesh.position.z;
        if ((e.dirZ > 0 && ez >= pz) || (e.dirZ < 0 && ez <= pz)) {
            e.scored = true;
            score += 1;
            hud.setTime(score);
        }
    });

    // Collision detection (AABB)
    let collided = false;
    spawner.forEachActive(e => {
        // Cheap broad-phase on Z to reduce Box3 work
        if (Math.abs(e.mesh.position.z - player.position.z) < 3.2) {
            playerBox.setFromObject(player).expandByScalar(-0.04);
            enemyBox.setFromObject(e.mesh).expandByScalar(-0.04);
            if (playerBox.intersectsBox(enemyBox)) {
                collided = true;
            }
        }
    });
    if (collided) {
        isGameOver = true;
        // Small camera shake effect
        const shake = 0.15;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        const prev = parseInt(localStorage.getItem("bestScore") || "0", 10);
        const current = Math.floor(score);
        const best = Math.max(prev, current);
        localStorage.setItem("bestScore", String(best));
        hud.showGameOver(current, best);
    }

    // Update chase camera
    chase.update(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Restart logic
function restart() {
    // Hide overlay & reset flags
    hud.hideGameOver();
    isGameOver = false;
    score = 0;
    hud.setTime(0);

    // Reset player position and lane (center)
    player.position.set(0, 0, 10);

    // Reset world scroll phase and segment positions
    phase = 0;
    const aZ0 = 0;
    const bZ0 = L * WORLD_SCROLL_DIR;
    world.roadA.position.z = aZ0;
    world.roadB.position.z = bZ0;
    world.grassLA.position.z = aZ0;
    world.grassLB.position.z = bZ0;
    world.grassRA.position.z = aZ0;
    world.grassRB.position.z = bZ0;
    world.markersA.position.z = aZ0;
    world.markersB.position.z = bZ0;

    // Reset spawner/enemies
    spawner.reset();
    // Reset clouds
    clouds.reset();
}

hud.onRestart(restart);

window.addEventListener("keydown", e => {
    if (isGameOver && (e.key === " " || e.key === "Enter")) {
        restart();
    }
});
