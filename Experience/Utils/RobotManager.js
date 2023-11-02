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
        this.boundingBox = [];
        this.boundingBoxHelpers = [];

        this.toolBar = this.experience.toolBar;
        this.ik = new InverseKinematics(this.controlRobot);
        this.cloneModel();
        this.setToolBar();
    }

    setToolBar() {
        let robotManager = this;
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
                BoundBox(){
                    robotManager.createBoundingBoxes();
                }
            };

            const robotFolder = this.toolBar.addFolder(`j${i}`);

            robotFolder.add(object.rotation, 'z', -Math.PI * 2, Math.PI * 2, Math.PI/6 );
            if (i === 1) {
                robotFolder.add(tools, 'BoundBox');
            }
            robotFolder.add(tools, 'Save');
            robotFolder.add(tools, 'Reset');
        }
    }

    cloneModel() {
        this.components.children.forEach((child) => {
            child.name = child.name.replace(/\(Default\).*$/, "").trim()
            this.controlRobot.set(child.name, child.clone());
            this.controlRobot.get(child.name).scale.set(1, 1, 1);
            this.generateBoundBoxMesh(this.controlRobot.get(child.name));
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

    generateBoundBoxMesh(model){
        if (model.name === "j6" || model.name === "basegear"){
            return;
        }
        model.traverse(child => {
            if (child instanceof THREE.Mesh && !child.userData.isBoundingBoxMesh) {
                if (!child.parent.parent.name.includes("j") && !child.parent.parent.name.includes("basetop")){
                    return;
                }
                let geometry;  // Geometry for the bounding shape
                const boundingBox = new THREE.Box3().setFromObject(child);
                const boxSize = boundingBox.getSize(new THREE.Vector3());
                const boxCenter = boundingBox.getCenter(new THREE.Vector3());

                //Check if the part is circular (based on some criteria, e.g., name)
                if (model.name.includes("basetop")) {  // Replace "circlePartName" with appropriate criteria
                    // Create a bounding cylinder
                    const radius = boxSize.x / 2;  // Assuming x dimension represents the diameter
                    const height = boxSize.y;
                    geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
                } else {
                    // Create a bounding box
                    geometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
                }
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(boxCenter);
                mesh.userData.isBoundingBoxMesh = true;
                mesh.updateMatrixWorld(true);
                child.add(mesh);
            }
        });
    }

    createBoundingBoxes() {
        if (this.boundingBox.length > 0 && this.boundingBoxHelpers.length > 0) {
            this.boundingBoxHelpers.forEach((box) => {
                this.scene.remove(box);
            });
            this.boundingBox = [];
            this.boundingBoxHelpers = [];
        }
        this.motionGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData.isBoundingBoxMesh) {
                const clone = child.clone();
                const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
                clone.material = blueMaterial;
                clone.scale.set(1, 1, 1);
                child.parent.add(clone);

                const worldScale = new THREE.Vector3();
                clone.getWorldScale(worldScale);
                clone.scale.copy(worldScale);

                const worldPosition = new THREE.Vector3();
                clone.getWorldPosition(worldPosition);
                clone.position.copy(worldPosition);

                const worldQuaternion = new THREE.Quaternion();
                clone.getWorldQuaternion(worldQuaternion);
                clone.quaternion.copy(worldQuaternion);

                clone.parent.remove(clone);
                //this.scene.add(clone);
                
                const boundingBox = new THREE.Box3().setFromObject(clone);
                const helper = new THREE.Box3Helper( boundingBox, 0xffff00 );
                this.boundingBoxHelpers.push(helper);
                this.scene.add( helper );
                this.boundingBox.push(boundingBox);
            }
        });
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
