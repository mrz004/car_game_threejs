import * as THREE from "three";
import {
    LANE_WIDTH,
    LANES,
    ROAD_LENGTH,
    ROAD_EXTRA_MARGIN,
    GRASS_WIDTH,
} from "./constants.js";

export function buildWorld(scene) {
    // Road (dark)
    const roadWidth = LANE_WIDTH * 3 + ROAD_EXTRA_MARGIN * 2;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, ROAD_LENGTH);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x2b2b2e,
        roughness: 1,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.5;
    road.name = "Road";
    scene.add(road);

    // Grass left & right
    const grassGeo = new THREE.PlaneGeometry(GRASS_WIDTH, ROAD_LENGTH);
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x2f6f2f,
        roughness: 1,
    });
    const grassL = new THREE.Mesh(grassGeo, grassMat);
    grassL.rotation.x = -Math.PI / 2;
    grassL.position.set(-(roadWidth / 2 + GRASS_WIDTH / 2), -0.5, 0);
    const grassR = grassL.clone();
    grassR.position.x *= -1;
    grassL.name = "GrassL";
    grassR.name = "GrassR";
    scene.add(grassL, grassR);

    // Lane markers (simple short dashes using box meshes)
    const markers = new THREE.Group();
    markers.name = "LaneMarkers";
    const dashLen = 3;
    const dashThick = 0.1;
    const dashTall = 0.02;
    const xPositions = [-(LANE_WIDTH / 2), LANE_WIDTH / 2]; // between lanes

    const count = Math.floor(ROAD_LENGTH / (dashLen * 2));
    for (let i = 0; i < count; i++) {
        const z = -ROAD_LENGTH / 2 + i * dashLen * 2;
        for (const x of xPositions) {
            const dashGeo = new THREE.BoxGeometry(dashThick, dashTall, dashLen);
            const dashMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.9,
            });
            const dash = new THREE.Mesh(dashGeo, dashMat);
            dash.position.set(x, -0.49, z);
            markers.add(dash);
        }
    }
    scene.add(markers);

    return { road, grassL, grassR, markers };
}

export { LANES };
