import * as THREE from "three";

// Simple car composed of body, cabin, and 4 wheels
// Returns { group, wheels } where group is a THREE.Group positioned at origin
export function buildPlayerCar(options = {}) {
    const {
        bodyColor = 0xff3344,
        cabinColor = 0xffffff,
        wheelColor = 0x111111,
        scale = 1,
    } = options;

    const group = new THREE.Group();
    group.name = "PlayerCar";

    // Dimensions (approx meters)
    const carWidth = 1.4 * scale; // x
    const carHeight = 0.6 * scale; // y
    const carLength = 2.6 * scale; // z

    // Body
    const bodyGeo = new THREE.BoxGeometry(carWidth, carHeight, carLength);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        metalness: 0.2,
        roughness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = false;
    body.position.y = carHeight / 2; // rest on ground
    body.name = "Body";
    group.add(body);

    // Cabin (slightly smaller, shifted backwards)
    const cabinGeo = new THREE.BoxGeometry(
        carWidth * 0.95,
        carHeight * 0.65,
        carLength * 0.55
    );
    const cabinMat = new THREE.MeshStandardMaterial({
        color: cabinColor,
        metalness: 0.1,
        roughness: 0.2,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = carHeight * 0.95;
    cabin.position.z = -carLength * 0.1;
    cabin.name = "Cabin";
    group.add(cabin);

    // Wheels
    const wheelRadius = 0.22 * scale;
    const wheelThickness = 0.18 * scale;
    const wheelGeo = new THREE.CylinderGeometry(
        wheelRadius,
        wheelRadius,
        wheelThickness,
        16
    );
    const wheelMat = new THREE.MeshStandardMaterial({
        color: wheelColor,
        roughness: 0.9,
        metalness: 0.0,
    });

    function makeWheel() {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        // Wheels rotate around X, so rotate geometry to stand upright on Z
        w.rotation.z = Math.PI / 2; // cylinder axis along X
        w.castShadow = false;
        return w;
    }

    const halfW = (carWidth / 2) * 0.9;
    const halfL = (carLength / 2) * 0.8;
    const wheelY = wheelRadius * 0.6; // slightly sunk for look

    const wFL = makeWheel(); // front-left
    wFL.position.set(-halfW, wheelY, -halfL);
    const wFR = makeWheel(); // front-right
    wFR.position.set(halfW, wheelY, -halfL);
    const wRL = makeWheel(); // rear-left
    wRL.position.set(-halfW, wheelY, halfL);
    const wRR = makeWheel(); // rear-right
    wRR.position.set(halfW, wheelY, halfL);

    const wheels = [wFL, wFR, wRL, wRR];
    wheels.forEach(w => group.add(w));

    // Headlights (simple emissive blocks)
    const headGeo = new THREE.BoxGeometry(
        0.08 * scale,
        0.08 * scale,
        0.06 * scale
    );
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 0.6,
    });
    const headL = new THREE.Mesh(headGeo, headMat);
    const headR = new THREE.Mesh(headGeo, headMat);
    const headZ = -carLength / 2 - 0.03 * scale;
    const headY = carHeight * 0.45;
    headL.position.set(-carWidth * 0.25, headY, headZ);
    headR.position.set(carWidth * 0.25, headY, headZ);
    group.add(headL, headR);

    // Store for updates
    group.userData.wheels = wheels;

    return { group, wheels };
}

export function spinWheels(wheels, speedUnitsPerSec, dt, wheelRadius = 0.22) {
    // angle = distance / radius; distance = speed * dt
    const angle = (speedUnitsPerSec * dt) / wheelRadius;
    for (const w of wheels) {
        // Wheels rotate around X axis
        w.rotation.x -= angle;
    }
}
