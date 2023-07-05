import * as THREE from "three";
import Experience from "../Experience.js";
import GSAP from "gsap";
import RobotManager from "../Utils/RobotManager.js";

export default class Robot {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.robotManager = new RobotManager();
        this.robot = this.robotManager.robot;
        // this.components = this.robot.children[0];
        // console.log(this.components);
        // this.group = new Map();

        this.lerp = {
            current: 0,
            target: 0,
            ease: 0.1,
        };

        this.setModel();
        this.onMouseMove();
    }
    setModel() {

        const width = 0.5;
        const height = 0.7;
        const intensity = 1;
        const rectLight = new THREE.RectAreaLight(
            0xffffff,
            intensity,
            width,
            height
        );
        rectLight.position.set(7.68244, 7, 0.5);
        rectLight.rotation.x = -Math.PI / 2;
        rectLight.rotation.z = Math.PI / 4;

        this.robot.add(rectLight);
        this.rectLight = rectLight;
        this.scene.add(this.robot);

    }

    onMouseMove() {
        window.addEventListener("mousemove", (e) => {
            this.rotation = ((e.clientX - window.innerWidth / 2) * 2) / window.innerWidth;
            this.lerp.target = this.rotation * 0.05;
        });
    }

    resize() {}

    update() {

        this.lerp.current = GSAP.utils.interpolate(
            this.lerp.current,
            this.lerp.target,
            this.lerp.ease
        );

        this.robot.rotation.y = this.lerp.current;

        this.robotManager.update();
    }
}
