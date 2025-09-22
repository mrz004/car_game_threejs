import * as THREE from "three";
import { buildPlayerCar } from "./playerCar.js";

const ColorPool = [
    0x2222aa, 0x16c47f, 0xffd65a, 0xff9d23, 0xf93827, 0x8c1eff, 0x00d2ff,
];

// Build an enemy car by reusing the player car geometry with different colors
export function buildEnemyCar() {
    const { group, wheels } = buildPlayerCar({
        bodyColor: ColorPool[Math.floor(Math.random() * ColorPool.length)],
        cabinColor: 0xddddff,
        wheelColor: 0x111111,
    });
    group.name = "EnemyCar";
    return { group, wheels };
}
