import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";

import {EventEmitter} from "events";

import Experience from "../Experience.js"


export default class RobotManager extends EventEmitter {
    constructor() {
        super();

        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.robot = this.resources.items.robot;
        this.components = this.robot.children[0];
        console.log(this.components);
        this.group = new Map();

        this.cloneModel();
        this.setModel();
    }

    setModel() {
        let count = 0;
        this.components.children.forEach((child) => { // this.group[child.name] = child.clone;
            console.log(child.position);
            child.position.copy(new THREE.Vector3(child.position.x, count, child.position.z));
            count += 30;
        });
    }

    cloneModel() {
        this.components.children.forEach((child) => { // this.group[child.name] = child.clone;
            this.group.set(child.name, child.clone());
        });
    }
    animate() {
        TWEEN.update();
        window.requestAnimationFrame(animate);

        this.components.children.forEach((object) => {
            if (object.position.y > this.group.get(object.name).position.y) {
                object.position.set(object.position.x, object.position.y - .2, object.position.z);
            }
        });
    }
    update() {
        // this.animate();
        // this.components.children.forEach((object) => { // this.group[child.name] = child.clone;
        //     const tween = new TWEEN.Tween({y: object.position.y}).to({
        //         y: this.group.get(object.name).position.y
        //     }, 100).onUpdate((coords) => {
        //         object.position.y = coords.y;
        //     });
        //     tween.start();
        // });
        this.components.children.forEach((object) => {
            if (object.position.y > this.group.get(object.name).position.y) {
                object.position.set(object.position.x, object.position.y - .2, object.position.z);
            }
        });
    }
}
