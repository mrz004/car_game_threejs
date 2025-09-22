import "./style.css";
import * as THREE from "three";
import { buildPlayerCar, spinWheels } from "./playerCar.js";
import { buildWorld } from "./world.js";
import { createControls } from "./controls.js";
import { createChaseCamera } from "./cameraRig.js";
import { SPEED_MIN, WORLD_SCROLL_DIR } from "./constants.js";

// Canvas
const canvas = document.getElementById("canvas");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101018);

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

    // Update controls/state
    const { speed } = controls.update(dt, player);

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

    // Update chase camera
    chase.update(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
