import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import GUI from "lil-gui";

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
        this.group = new Map();

        this.ToolBar = new GUI();

        this.setToolBar();
        this.cloneModel();
        this.setModel();
    }
    setToolBar() {
        this.components.children.forEach((object) => {
            if (object.name == "Step - Nema 17 - 17HS4401S - Usongshine(Varsayılan)Görüntü Durumu 1") 
                object.name = "Nema17"
            
            const robotFolder = this.ToolBar.addFolder(object.name.replace(/\(Default\).*$/, "").trim())
            robotFolder.add(object.position, 'x', 0, 500);
            robotFolder.add(object.position, 'y', 0, 500);
            robotFolder.add(object.position, 'z', 0, 500);
            robotFolder.open();
        });
        console.log(this.ToolBar.children);
    }
    setModel() {
        let count = 0;
        this.components.children.forEach((child) => { // this.group[child.name] = child.clone;
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
        this.ToolBar.children.forEach((GUI) =>{
            GUI.controllers.forEach((controller) =>{
                controller.updateDisplay();
            });
        });
        this.components.children.forEach((object) => {
            if (object.position.y > this.group.get(object.name).position.y) {
                object.position.set(object.position.x, object.position.y - .2, object.position.z);
            }
        });
    }
}
