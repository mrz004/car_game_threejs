import * as THREE from "three";

// Simple drifting clouds for background/sky
// Usage:
//   const clouds = createClouds(scene, { count, zRange, xRange, yRange })
//   clouds.update(dt, playerSpeed)
//   clouds.reset()
export function createClouds(scene, opts = {}) {
    const settings = {
        count: opts.count ?? 12,
        // Clouds span across X, with Z depth for parallax
        xRange: opts.xRange ?? { min: -120, max: 120 },
        yRange: opts.yRange ?? { min: 10, max: 22 },
        zRange: opts.zRange ?? { min: -140, max: 40 },
        baseSpeed: opts.baseSpeed ?? 2.0, // units/sec
        variance: opts.variance ?? 1.8, // speed variance
        tint: opts.tint ?? 0xffffff,
    };

    const clouds = [];
    const material = new THREE.MeshLambertMaterial({ color: settings.tint });

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function makeCloud() {
        const group = new THREE.Group();
        const n = 3 + Math.floor(Math.random() * 3); // 3..5 lumps
        for (let i = 0; i < n; i++) {
            const sx = rand(1.2, 2.6);
            const sy = rand(0.8, 1.8);
            const sz = rand(1.2, 2.4);
            const geom = new THREE.SphereGeometry(1, 12, 10);
            const mesh = new THREE.Mesh(geom, material);
            mesh.scale.set(sx, sy, sz);
            const ox = rand(-1.8, 1.8);
            const oy = rand(-0.6, 0.6);
            const oz = rand(-0.8, 0.8);
            mesh.position.set(ox, oy, oz);
            group.add(mesh);
        }
        // soft rotation so not perfectly aligned
        group.rotation.y = rand(-0.2, 0.2);
        group.rotation.z = rand(-0.05, 0.05);
        return group;
    }

    function spawnCloud(offscreenLeft = false) {
        const g = makeCloud();
        const z = rand(settings.zRange.min, settings.zRange.max);
        const y = rand(settings.yRange.min, settings.yRange.max);
        // If offscreenLeft, start at left edge; otherwise random within range
        const x = offscreenLeft
            ? settings.xRange.min - rand(10, 40)
            : rand(settings.xRange.min, settings.xRange.max);
        g.position.set(x, y, z);

        // Parallax: farther (more negative Z) -> slower
        const depthT = THREE.MathUtils.clamp(
            (z - settings.zRange.min) /
                (settings.zRange.max - settings.zRange.min + 1e-6),
            0,
            1
        );
        const speedX =
            settings.baseSpeed * (0.4 + 0.9 * (1 - depthT)) +
            rand(-settings.variance, settings.variance);

        scene.add(g);
        return { group: g, speedX };
    }

    function initialize() {
        // Seed a few offscreen left so they drift in
        const leftSeed = Math.max(2, Math.floor(settings.count * 0.25));
        for (let i = 0; i < settings.count; i++) {
            const c = spawnCloud(i < leftSeed);
            clouds.push(c);
        }
    }

    function update(dt, playerSpeed = 0) {
        // slight boost based on player speed for liveliness
        const speedBoost = 0.02 * playerSpeed; // small influence
        for (const c of clouds) {
            c.group.position.x += (c.speedX + speedBoost) * dt;
            if (c.group.position.x > settings.xRange.max + 40) {
                // wrap to left with new y/z and speed
                c.group.position.x = settings.xRange.min - 40;
                c.group.position.y = rand(
                    settings.yRange.min,
                    settings.yRange.max
                );
                c.group.position.z = rand(
                    settings.zRange.min,
                    settings.zRange.max
                );
                const z = c.group.position.z;
                const depthT = THREE.MathUtils.clamp(
                    (z - settings.zRange.min) /
                        (settings.zRange.max - settings.zRange.min + 1e-6),
                    0,
                    1
                );
                c.speedX =
                    settings.baseSpeed * (0.4 + 0.9 * (1 - depthT)) +
                    rand(-settings.variance, settings.variance);
            }
        }
    }

    function reset() {
        // Re-randomize positions within range and randomize speeds
        for (const c of clouds) {
            c.group.position.set(
                rand(settings.xRange.min, settings.xRange.max),
                rand(settings.yRange.min, settings.yRange.max),
                rand(settings.zRange.min, settings.zRange.max)
            );
            const z = c.group.position.z;
            const depthT = THREE.MathUtils.clamp(
                (z - settings.zRange.min) /
                    (settings.zRange.max - settings.zRange.min + 1e-6),
                0,
                1
            );
            c.speedX =
                settings.baseSpeed * (0.4 + 0.9 * (1 - depthT)) +
                rand(-settings.variance, settings.variance);
        }
    }

    function dispose() {
        for (const c of clouds) {
            scene.remove(c.group);
        }
        clouds.length = 0;
    }

    initialize();
    return { update, reset, dispose };
}
