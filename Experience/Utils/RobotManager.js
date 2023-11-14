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
        this.meshes = [];

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
                checkCollision() {
                    var raycaster = new THREE.Raycaster();
                    var collision = false;
                    
                    // Assuming robotManager.meshes contains all the joint meshes
                    for (let i = 0; i <= 5; i++) {
                        for (let j = i + 1; j <= 5; j++) {
                            let mesh1 = robotManager.meshes[i];
                            let mesh2 = robotManager.meshes[j];
                    
                            // Skip collision check if it's the same mesh
                            if (mesh1 === mesh2) continue;

                            var positions = mesh1.geometry.attributes.position;
                            var vertex = new THREE.Vector3();
                            
                            for (let k = 0; k < positions.count; k++) {
                                vertex.fromBufferAttribute(positions, k);
                                var localVertex = vertex.clone();
                                var globalVertex = localVertex.applyMatrix4(mesh1.matrixWorld);
                                var directionVector = globalVertex.sub(mesh1.position);

                                // Create a geometry for the ray
                                var rayGeometry = new THREE.BufferGeometry().setFromPoints([mesh1.position, globalVertex]);

                                // Add the line to the scene (you'll want to remove it later)
                                robotManager.scene.add(rayLine);          

                                raycaster.set(mesh1.position, directionVector.clone().normalize());
                                if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                                    collision = true;
                                    mesh1.material.color.set(0x00ff00);
                                    mesh2.material.color.set(0x0000ff);
                                    console.log(mesh1.parent.parent.parent.name + " and " + mesh2.parent.parent.parent.name + " are colliding.");
                                    break;
                                }
                            }
                    
                            // If a collision is detected, break out of the inner loop
                            if (collision) break;
                        }
                    
                        // If a collision is detected, break out of the outer loop
                        if (collision) break;
                    }
                    
                    if (collision) {
                        // Handle the collision
                    } else {
                        // No collision detected
                    }
                }
            };

            const robotFolder = this.toolBar.addFolder(`j${i}`);

            robotFolder.add(object.rotation, 'z', -Math.PI * 2, Math.PI * 2, Math.PI/6 );
            if (i === 1) {
                robotFolder.add(tools, 'checkCollision');
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
                this.meshes.push(mesh);

                // Set the mesh to be not visible
                mesh.visible = false;
            }
        });
        // console.log(this.meshes);
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
