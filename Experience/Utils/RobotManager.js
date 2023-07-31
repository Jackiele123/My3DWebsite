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


        this.motionGroup = new THREE.Group();
        // this.motionGroup.scale.set(0.01, 0.01, 0.01);
        this.group = new Map();

        this.ToolBar = new GUI({width: 250});
        // this.setHelperLines();
        this.cloneModel();
        this.setToolBar();
        // this.setModel();
        // this.setMotionGroup();
        // this.tween = new TWEEN.Tween(this.components.children[13].position).to({x: 200}, 1000).start()
    }

    // setHelperLines() {
    //     this.motionGroup.add(new THREE.AxesHelper(5));
    // }

    setToolBar() {
        for (let i = 1; i < 6; i++) {
            console.log(`j${i}`);
            let object = this.group.get(`j${i}`);
            const tools = {
                xPosition: object.position.x,
                yPosition: object.position.y,
                zPosition: object.position.z,
                xRotation: object.rotation.x,
                yRotation: object.rotation.y,
                zRotation: object.rotation.z,
                Save() {
                    console.log(object.position);
                },
                Reset() {
                    object.position.set(tools.xPosition, tools.yPosition, tools.zPosition);
                    object.rotation.set(tools.xRotation, tools.yRotation, tools.zRotation);
                }
            };

            const robotFolder = this.ToolBar.addFolder(object.name);
            if (object.name === "j2") 
                robotFolder.add(object.rotation, 'z', 0, Math.PI * 2);
             else 
                robotFolder.add(object.rotation, 'y', 0, Math.PI * 2);
            
            // robotFolder.add(object.position, 'x', 0, 500);
            // robotFolder.add(object.position, 'y', 0, 500);
            // robotFolder.add(object.position, 'z', 0, 500);
            // robotFolder.add(tools, 'Save');
            robotFolder.add(tools, 'Reset');
            robotFolder.close();
        }
        console.log(this.ToolBar);
    }

    setModel() {
        this.components.children.forEach((child) => {
            child.rotation.copy(new THREE.Vector3(child.position.x, child.position.y, child.position.z));
        });
    }

    cloneModel() {
        this.components.children.forEach((child) => {
            child.name = child.name.replace(/\(Default\).*$/, "").trim()
            this.group.set(child.name, child.clone());
            this.group.get(child.name).scale.set(1, 1, 1);
        });
        this.setMotionGroup();
        console.log(this.group);
    }

    setMotionGroup() {
        let axesHelper = new THREE.AxesHelper(75);
        // this.motionGroup.add(axesHelper.clone());
        this.motionGroup.attach(this.group.get("basegear"));
        this.motionGroup.attach(this.group.get("basetophousing"));
        this.motionGroup.attach(this.group.get("j1"));
        this.group.get("j1").attach(this.group.get("j2"));
        this.group.get("j2").attach(this.group.get("j3"));
        this.group.get("j3").attach(this.group.get("j4"));
        this.group.get("j4").attach(this.group.get("j5"));
        axesHelper.position.set(13, 0, 78)
        this.group.get("j5").add(axesHelper.clone());
        this.motionGroup.scale.set(.01, .01, .01);
        this.motionGroup.position.set(0, 0, 0);
        this.scene.add(this.motionGroup);
        console.log(this.motionGroup);
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
