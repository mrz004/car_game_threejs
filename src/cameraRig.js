import * as THREE from "three";

export function createChaseCamera(camera, target, options = {}) {
    const {
        offset = new THREE.Vector3(0, 5.5, 10),
        lookOffset = new THREE.Vector3(0, 1.0, -4),
        lerp = 5.0, // 1/sec
    } = options;

    const desired = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    function update(dt) {
        desired.copy(target.position).add(offset);
        camera.position.lerp(desired, 1 - Math.exp(-lerp * dt));

        lookAt.copy(target.position).add(lookOffset);
        camera.lookAt(lookAt);
    }

    return { update };
}
