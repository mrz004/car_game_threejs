import * as THREE from "three";
import { LANES, SPEED_MIN } from "./constants.js";
import { buildEnemyCar } from "./enemyCar.js";

export function createSpawner(scene) {
    const pool = [];
    const active = [];
    const tmp = new THREE.Box3();

    let time = 0;
    let nextSpawn = 1.2; // seconds until next spawn

    function acquire() {
        if (pool.length > 0) return pool.pop();
        const { group, wheels } = buildEnemyCar();
        return { mesh: group, wheels, speed: 0, laneIndex: 0 };
    }

    function release(obj) {
        scene.remove(obj.mesh);
        pool.push(obj);
    }

    function scheduleNext(t) {
        // Difficulty ramp: spawn rate increases slightly over time
        const base = 1.1;
        const minIvl = 0.45;
        const ramp = Math.max(minIvl, base - 0.01 * t);
        nextSpawn = ramp * (0.8 + Math.random() * 0.4); // add some jitter
    }

    function spawn(playerZ, playerSpeed) {
        const obj = acquire();
        const laneIdx = -1 + Math.floor(Math.random() * 3); // -1,0,1
        const x = LANES[laneIdx + 1];

        // Place ahead depending on camera/player forward direction
        const zStart = playerZ - 80 - Math.random() * 40; // spawn forward (negative Z ahead when camera looks -Z)
        obj.mesh.position.set(x, 0, zStart);

        // Movement direction toward player at spawn (keep constant so it passes by)
        obj.dirZ = Math.sign(playerZ - zStart) || 1; // +1 moves toward +Z, -1 toward -Z
        obj.mesh.rotation.y = obj.dirZ > 0 ? 0 : Math.PI;

        // Speed relative to player (approach)
        const rel = 0.6 + Math.random() * 0.6; // 0.6..1.2
        obj.speed = playerSpeed * rel + SPEED_MIN * 0.3; // units/sec
        obj.laneIndex = laneIdx;

        scene.add(obj.mesh);
        active.push(obj);
    }

    function update(dt, player, playerSpeed, worldLength, scrollDir) {
        time += dt;
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
            spawn(player.position.z, playerSpeed);
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
    }

    return { update, forEachActive, reset };
}
