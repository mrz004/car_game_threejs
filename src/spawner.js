import * as THREE from "three";
import { LANES, SPEED_MIN } from "./constants.js";
import { buildEnemyCar } from "./enemyCar.js";

export function createSpawner(scene) {
    const pool = [];
    const active = [];
    const tmp = new THREE.Box3();

    let time = 0;
    let nextSpawn = 1.2; // seconds until next spawn
    let baseSpeedBoost = 0; // increases slowly over time

    function acquire() {
        if (pool.length > 0) return pool.pop();
        const { group, wheels } = buildEnemyCar();
        return { mesh: group, wheels, speed: 0, laneIndex: 0, scored: false };
    }

    function release(obj) {
        scene.remove(obj.mesh);
        pool.push(obj);
    }

    function scheduleNext(t) {
        // Difficulty ramp: spawn rate increases slightly over time
        const base = 1.1;
        const minIvl = 0.4;
        const ramp = Math.max(minIvl, base - 0.012 * t);
        nextSpawn = ramp * (0.8 + Math.random() * 0.4); // add some jitter
    }

    function spawn(playerZ, playerSpeed, laneIdx) {
        const obj = acquire();
        if (laneIdx === undefined) laneIdx = -1 + Math.floor(Math.random() * 3); // -1,0,1
        const x = LANES[laneIdx + 1];

        // Place ahead depending on camera/player forward direction
        const zStart = playerZ - 80 - Math.random() * 40; // spawn forward (negative Z ahead when camera looks -Z)
        obj.mesh.position.set(x, 0, zStart);

        // Movement direction toward player at spawn (keep constant so it passes by)
        obj.dirZ = Math.sign(playerZ - zStart) || 1; // +1 moves toward +Z, -1 toward -Z
        obj.mesh.rotation.y = obj.dirZ > 0 ? 0 : Math.PI;

        // Speed relative to player (approach)
        const rel = 0.6 + Math.random() * 0.6; // 0.6..1.2
        obj.speed = playerSpeed * rel + SPEED_MIN * 0.3 + baseSpeedBoost; // units/sec
        obj.laneIndex = laneIdx;
        obj.scored = false;

        scene.add(obj.mesh);
        active.push(obj);
    }

    function update(dt, player, playerSpeed, worldLength, scrollDir) {
        time += dt;
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
            // Occasionally spawn two enemies in different lanes
            const double = Math.random() < Math.min(0.35, 0.08 + time * 0.02);
            if (double) {
                const firstLane = -1 + Math.floor(Math.random() * 3);
                let secondLane = firstLane;
                // pick a different lane
                while (secondLane === firstLane)
                    secondLane = -1 + Math.floor(Math.random() * 3);
                spawn(player.position.z, playerSpeed, firstLane);
                spawn(player.position.z - 10, playerSpeed, secondLane); // small stagger to avoid boxed-in wall
            } else {
                spawn(player.position.z, playerSpeed);
            }
            scheduleNext(time);
        }

        // Move enemies along their fixed direction
        for (let i = active.length - 1; i >= 0; i--) {
            const e = active[i];
            e.mesh.position.z += e.dirZ * e.speed * dt;

            // Cleanup when far behind player
            const aheadMargin = worldLength * 0.8; // how far past screen to remove
            if (
                (e.dirZ > 0 &&
                    e.mesh.position.z > player.position.z + aheadMargin) ||
                (e.dirZ < 0 &&
                    e.mesh.position.z < player.position.z - aheadMargin)
            ) {
                active.splice(i, 1);
                release(e);
            }
        }

        // Increase difficulty slowly
        baseSpeedBoost = Math.min(8, time * 0.15);
    }

    function forEachActive(fn) {
        for (const e of active) fn(e);
    }

    function reset() {
        // remove active enemies from scene and return to pool
        for (let i = active.length - 1; i >= 0; i--) {
            const e = active[i];
            scene.remove(e.mesh);
            pool.push(e);
        }
        active.length = 0;
        time = 0;
        nextSpawn = 1.2;
        baseSpeedBoost = 0;
    }

    return { update, forEachActive, reset };
}
