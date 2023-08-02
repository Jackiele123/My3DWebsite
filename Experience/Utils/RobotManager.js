import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";

import {EventEmitter} from "events";
import Experience from "../Experience.js"
import InverseKinematics from "./InverseKinematics.js";

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
        this.group = new Map();

        this.toolBar = this.experience.toolBar;
        this.ik = new InverseKinematics(this.group);
        this.cloneModel();
        this.setToolBar();
    }

    setToolBar() {
        for (let i = 1; i < 7; i++) {
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
                    console.log(object.rotation);
                },
                Reset() {
                    object.position.set(tools.xPosition, tools.yPosition, tools.zPosition);
                    object.rotation.set(tools.xRotation, tools.yRotation, tools.zRotation);
                }
            };

            const robotFolder = this.toolBar.addFolder(`j${i}`);

            robotFolder.add(object.rotation, 'z', -Math.PI * 2, Math.PI * 2);

            robotFolder.add(tools, 'Save');
            robotFolder.add(tools, 'Reset');
            robotFolder.close();
        }
    }

    cloneModel() {
        this.components.children.forEach((child) => {
            child.name = child.name.replace(/\(Default\).*$/, "").trim()
            this.group.set(child.name, child.clone());
            this.group.get(child.name).scale.set(1, 1, 1);
        });
        let j6 = new THREE.AxesHelper(75);
        j6.position.set(-80, 0, 13);
        j6.rotation.set(0, Math.PI, 0);
        this.group.set("j6", j6);
        this.setMotionGroup();
    }

    setMotionGroup() {
        this.motionGroup.attach(this.group.get("basegear"));
        this.motionGroup.attach(this.group.get("basetophousing"));
        this.motionGroup.attach(this.group.get("j1"));
        this.group.get("j1").attach(this.group.get("j2"));
        this.group.get("j2").attach(this.group.get("j3"));
        this.group.get("j3").attach(this.group.get("j4"));
        this.group.get("j4").attach(this.group.get("j5"));
        this.group.get("j5").add(this.group.get("j6"));
        this.motionGroup.scale.set(.01, .01, .01);
        this.motionGroup.position.set(0, 0, 0);
        this.scene.add(this.motionGroup);
        // this.ik.addHelperTools();
        console.log(this.ik.forwardKinematics());
        let test = new THREE.Vector3(0, 0, 0);
        console.log(this.group.get("j6").getWorldPosition(test));
    }

    update() { // animate();
        this.toolBar.children.forEach((GUI) => {
            GUI.controllers.forEach((controller) => {
                controller.updateDisplay();
            });
        });
    }
}
