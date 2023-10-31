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
        this.controlRobot = new Map();

        this.toolBar = this.experience.toolBar;
        this.ik = new InverseKinematics(this.controlRobot);
        this.cloneModel();
        this.setToolBar();
    }

    setToolBar() {
        for (let i = 1; i < 7; i++) {
            let object = this.controlRobot.get(`j${i}`);
            let target = 0;
            const tools = {
                xPosition: object.position.x,
                yPosition: object.position.y,
                zPosition: object.position.z,
                xRotation: object.rotation.x,
                yRotation: object.rotation.y,
                zRotation: object.rotation.z,
                desiredOrientation: target,
                Save() {
                    console.log(object.position);
                    console.log(object.rotation);
                },
                Reset() {
                    object.position.set(tools.xPosition, tools.yPosition, tools.zPosition);
                    object.rotation.set(tools.xRotation, tools.yRotation, tools.zRotation);
                },
            };

            const robotFolder = this.toolBar.addFolder(`j${i}`);

            robotFolder.add(object.rotation, 'z', -Math.PI * 2, Math.PI * 2, Math.PI/6 );
            robotFolder.add(tools, 'Save');
            robotFolder.add(tools, 'Reset');
        }
    }

    cloneModel() {
        this.components.children.forEach((child) => {
            child.name = child.name.replace(/\(Default\).*$/, "").trim()
            this.controlRobot.set(child.name, child.clone());
            this.controlRobot.get(child.name).scale.set(1, 1, 1);
        });
        this.setMotionGroup();
    }

    setMotionGroup() {
        this.motionGroup.attach(this.controlRobot.get("basegear"));
        this.motionGroup.attach(this.controlRobot.get("basetophousing"));
        this.motionGroup.attach(this.controlRobot.get("j1"));
        this.controlRobot.get("j1").attach(this.controlRobot.get("j2"));
        this.controlRobot.get("j2").attach(this.controlRobot.get("j3"));
        this.controlRobot.get("j3").attach(this.controlRobot.get("j4"));
        this.controlRobot.get("j4").attach(this.controlRobot.get("j5"));
        this.controlRobot.get("j5").attach(this.controlRobot.get("j6"));
        this.motionGroup.scale.set(.01, .01, .01);
        this.motionGroup.position.set(0, 0, 0);
        this.scene.add(this.motionGroup);
    }

    update() { // animate();
        this.toolBar.children.forEach((GUI) => {
            GUI.controllers.forEach((controller) => {
                controller.updateDisplay();
            });
        });
        this.ik.update();
    }
}
