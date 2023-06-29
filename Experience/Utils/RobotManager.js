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
        this.renderer = this.experience.renderer;
        this.camera = this.experience.camera;

        this.time = this.experience.time;
        this.robot = this.resources.items.robot;
        this.components = this.robot.children[0];
        this.group = new Map();

        this.ToolBar = new GUI({width: 250});

        this.setToolBar();
        this.cloneModel();
        // this.setModel();
        //this.tween = new TWEEN.Tween(this.components.children[13].position).to({x: 200}, 1000).start()
    }
    setToolBar() {
        this.components.children.forEach((object) => {
            if (object.name == "Step - Nema 17 - 17HS4401S - Usongshine(Varsayılan)Görüntü Durumu 1") 
                object.name = "Nema17"


            


            const tools = {
                xPosition: object.position.x,
                yPosition: object.position.y,
                zPosition: object.position.z,

                Save() {
                    console.log(object.position);
                },
                Reset() {
                    object.position.set(tools.xPosition, tools.yPosition, tools.zPosition);
                }
            };

            const robotFolder = this.ToolBar.addFolder(object.name.replace(/\(Default\).*$/, "").trim())
            robotFolder.add(object.position, 'x', 0, 500);
            robotFolder.add(object.position, 'y', 0, 500);
            robotFolder.add(object.position, 'z', 0, 500);
            robotFolder.add(tools, 'Save');
            robotFolder.add(tools, 'Reset');
            robotFolder.open();
        });
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
        requestAnimationFrame(this.animate());
    }

    bounce = () => {
        new TWEEN.Tween(cube.position).to({
            y: 1
        }, 500).easing(TWEEN.Easing.Cubic.Out).start().onComplete(() => {
            new TWEEN.Tween(cube.position).to({
                y: 0
            }, 500).easing(TWEEN.Easing.Cubic.In).start()
        })
    }

    update() { // animate();
        this.ToolBar.children.forEach((GUI) => {
            GUI.controllers.forEach((controller) => {
                controller.updateDisplay();
            });
        });

        // this.components.children.forEach((object) => {
        //     if (object.position.y > this.group.get(object.name).position.y) {
        //         object.position.set(object.position.x, object.position.y - .2, object.position.z);
        //     }
        // });
    }
}
