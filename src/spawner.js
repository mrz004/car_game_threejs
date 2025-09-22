import * as THREE from "three";
import {
    LANES,
    CAR_LENGTH,
    AVG_SPEED,
    ENEMY_SPAWN_DISTANCE,
} from "./constants.js";
import { buildEnemyCar } from "./enemyCar.js";
// import { GlobalControls } from "./main.js"; // unused here

export function createSpawner(scene) {
    const pool = [];
    const active = [];
    // const tmp = new THREE.Box3(); // currently unused

    let time = 0;
    let nextSpawn = 1.2; // legacy timer (not used after distance-based change)
    let baseSpeedBoost = 0; // increases slowly over time (kept for compatibility)
    let distanceAccumulator = ENEMY_SPAWN_DISTANCE; // seed so one spawns immediately

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
        // Timer-based schedule no longer used; kept to avoid breaking references
        nextSpawn = 9999; // effectively disable time-based spawn
    }

    // Ensure at least one-car gap on Z against all active enemies in the same lane
    function adjustZForSpacing(laneIdx, initialZ) {
        const minGap = CAR_LENGTH * 1.2; // safety margin
        let z = initialZ;
        // Iterate until no conflicts or max iterations to avoid infinite loops
        for (let iter = 0; iter < 8; iter++) {
            let moved = false;
            for (let i = 0; i < active.length; i++) {
                const e = active[i];
                if (e.laneIndex !== laneIdx) continue;
                const ez = e.mesh.position.z;
                const diff = Math.abs(z - ez);
                if (diff < minGap) {
                    // Push further ahead (more negative Z) to keep spacing
                    z = Math.min(z, ez) - (minGap - diff);
                    moved = true;
                }
            }
            if (!moved) break;
        }
        return z;
    }

    function spawn(playerZ, playerSpeed, laneIdx) {
        const obj = acquire();
        if (laneIdx === undefined) laneIdx = -1 + Math.floor(Math.random() * 3); // random lane: -1,0,1
        const x = LANES[laneIdx + 1];

        // Place at a fixed offset ahead of the player so cars enter the scene naturally
        let zStart = playerZ - 80 - Math.random() * 20; // slight jitter to avoid uniformity

        // Ensure no two cars share the same Z (across all lanes)
        const zEpsilon = 0.01;
        let adjustCount = 0;
        while (
            active.some(e => Math.abs(e.mesh.position.z - zStart) < zEpsilon) &&
            adjustCount < 10
        ) {
            zStart -= CAR_LENGTH * 0.5; // nudge further ahead until unique
            adjustCount++;
        }
        obj.mesh.position.set(x, 0, zStart);

        // Movement direction toward player at spawn (keep constant so it passes by)
        obj.dirZ = Math.sign(playerZ - zStart) || 1; // +1 moves toward +Z, -1 toward -Z
        obj.mesh.rotation.y = obj.dirZ > 0 ? 0 : Math.PI;

        // Fixed enemy speed per request
        obj.speed = AVG_SPEED;
        obj.laneIndex = laneIdx;
        obj.scored = false;

        scene.add(obj.mesh);
        active.push(obj);
    }

    function update(dt, player, playerSpeed, worldLength, scrollDir) {
        time += dt;

        // Distance-based spawning using player's speed magnitude
        // This works even if player.position.z stays constant (world scrolling)
        const speed = Math.abs(playerSpeed) || 0;
        distanceAccumulator += speed * dt;
        while (distanceAccumulator >= ENEMY_SPAWN_DISTANCE) {
            spawn(player.position.z, playerSpeed);
            distanceAccumulator -= ENEMY_SPAWN_DISTANCE;
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

        // Ensure unique Z levels at runtime as well (across all cars)
        // If any two cars end up at the same Z (rare), nudge later ones slightly
        const zEpsilon = 0.001;
        const seenZ = new Set();
        for (let i = 0; i < active.length; i++) {
            const e = active[i];
            let key = Math.round(e.mesh.position.z / zEpsilon);
            while (seenZ.has(key)) {
                e.mesh.position.z -= zEpsilon; // small nudge ahead
                key = Math.round(e.mesh.position.z / zEpsilon);
            }
            seenZ.add(key);
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
        distanceAccumulator = ENEMY_SPAWN_DISTANCE; // force a spawn immediately after reset
        baseSpeedBoost = 0;
    }

    return { update, forEachActive, reset };
}
