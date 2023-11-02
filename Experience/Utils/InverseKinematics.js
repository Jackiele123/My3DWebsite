import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import GUI from "lil-gui";

import {EventEmitter} from "events";
import Experience from "../Experience.js"
import { abs } from "numeric";

export default class InverseKinematics extends EventEmitter {
    constructor(robotJointMap) {
        super();

        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.renderer = this.experience.renderer;
        this.camera = this.experience.camera;
        this.toolBar = this.experience.toolBar;
        this.time = this.experience.time;
        this.robot = this.resources.items.robot;
        this.components = this.robot.children[0];
        this.robotJointMap = robotJointMap;
        console.log(this.robotJointMap);
        this.boundingBoxes = this.resources.boundingBoxes;
        console.log(this.boundingBoxes);
        this.tempBoundingBoxVisuals = [];
        this.addIKGUI();
        // DH parameters for a 6DOF robot arm with offset link 1
        this.DHParameters = [
            // Link 1 (Base to Joint 1)
            {
                d: 87, // Offset distance along the previous Z, from old joint to new joint center. [mm]
                a: 35, // Length along new X, from old joint to new joint center. [mm]
                theta: 0, // Angle about previous Z-axis, from old X-axis to new X-axis. [radians]
                alpha: Math.PI / 2 // Angle about new X-axis, from old Z-axis to new Z-axis. [radians]
            },
            // Link 2 (Joint 1 to Joint 2)
            {
                d: 0,
                a: 147.25,
                theta: Math.PI / 2,
                alpha: 0
            },
            // Link 3 (Joint 2 to Joint 3)
            {
                d: 0,
                a: 55.5,
                theta: -Math.PI,
                alpha: Math.PI / 2
            },
            // Link 4 (Joint 3 to Joint 4)
            {
                d: 141.6,
                a: 0,
                theta: 0,
                alpha: -Math.PI / 2
            },
            // Link 5 (Joint 4 to Joint 5)
            {
                d: 0,
                a: 0,
                theta: 0,
                alpha: Math.PI / 2
            },
            // Link 6 (Joint 5 to End Effector)
            {
                d: 80,
                a: 0,
                theta: 0,
                alpha: 0
            },
        ];
    }

    
    addIKGUI() {
        let IKToolBar = this.toolBar.addFolder("IK Tools");
        let IK = this;
        const axesHelper = new THREE.AxesHelper(200);
        const tools = {
            target1: 0,
            target2: 0,
            target3: 90,
            target4: 0,
            target5: 0,
            target6: 0, 
            joint: 1,
            axesHelper: axesHelper,
            calculateFK() {
                console.log(IK.forwardKinematics().position);
            },
            addHelperTools() {
                let object = IK.robotJointMap.get(`j${
                    this.joint
                }`);
                if (object !== undefined) 
                    object.add(axesHelper);                
            },
            DeleteHelperTools() {
                axesHelper.removeFromParent();
            },
            RotateJoints(){
                let target = [tools.target1*(Math.PI/180),tools.target2*(Math.PI/180),tools.target3*(Math.PI/180),tools.target4*(Math.PI/180),tools.target5*(Math.PI/180),tools.target6*(Math.PI/180)];
                IK.rotateJoint(target);
                IK.checkSelfCollisions();
            }
        }
        IKToolBar.add(tools, "target1", -180, 180, 5 );
        IKToolBar.add(tools, "target2", -180, 180, 5 );
        IKToolBar.add(tools, "target3", -180, 180, 5 );
        IKToolBar.add(tools, "target4", -180, 180, 5 );
        IKToolBar.add(tools, "target5", -180, 180, 5 );
        IKToolBar.add(tools, "target6", -180, 180, 5 );
        IKToolBar.add(tools, "calculateFK");
        IKToolBar.add(tools, "RotateJoints");
        // IKToolBar.add(tools, "addHelperTools");
        // IKToolBar.add(tools, "DeleteHelperTools");
    }

    addHelperTools() {
        for (let i = 1; i < 7; i++) {
            let object = this.robotJointMap.get(`j${i}`);
            const axesHelper = new THREE.AxesHelper(200);
            if (object !== undefined) 
                object.add(axesHelper);
        }
    }

    getJointAngles() {
        let jointAngles = [];
        for (let i = 1; i < 7; i++) {
            let object = this.robotJointMap.get(`j${i}`);
            if (object !== undefined) {
                // if (i == 1 || i == 4 || i == 6) {
                //     jointAngles.push(0);
                //     continue
                // }
                let rotation = object.rotation;
                jointAngles.push(rotation.z);
            } else 
                console.log(`j${i} is undefined`);
        }
        return jointAngles;
    }

    getTwistAngles() {
        let twistAngles = [];
        for (let i = 1; i < 7; i++) {
            let object = this.robotJointMap.get(`j${i}`);
            if (object !== undefined) {
                if (i == 2 || i == 3 || i == 5) {
                    twistAngles.push(0);
                    continue
                }
                let rotation = object.rotation;
                twistAngles.push(rotation.z);
            } else 
                console.log(`j${i} is undefined`);
            


        }
        return twistAngles;
    }

    // A helper function that calculates the transformation matrix from one joint to the next.
    getTransformationMatrix({d, a, theta, alpha}) {
        const ct = Math.cos(theta);
        const st = Math.sin(theta);
        const ca = Math.cos(alpha);
        const sa = Math.sin(alpha);

        return [
        [ct, -st*ca, st*sa, a*ct],
        [st, ct*ca, -ct*sa, a*st],
        [0, sa, ca, d],
        [0, 0, 0, 1]
        ];
    }
    // A helper function that multiplies two 4x4 matrices.
    multiplyMatrices(a, b) {
        let result = [];

        for(let i = 0; i < 4; i++) {
            result[i] = [];
            for(let j = 0; j < 4; j++) {
                let sum = 0;
                for(let k = 0; k < 4; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }

        return result;
    }

    createIndependentMeshesFromBoundingBoxes() {
        // Array to store the new independent meshes
        this.independentMeshes = [];
    
        this.boundingBoxes.forEach((mesh, key) => {
            // Clone the original mesh
            const meshCopy = mesh.clone();
    
            // If the mesh has a parent, detach it to make it independent
            if (meshCopy.parent) {
                meshCopy.parent.remove(meshCopy);
            }
    
            // Ensure world matrix is updated
            meshCopy.updateMatrixWorld(true);
    
            // Compute local bounding box
            const localBoundingBox = new THREE.Box3().setFromObject(meshCopy);
    
            // Get the size and center of the bounding box
            const boxSize = localBoundingBox.getSize(new THREE.Vector3());
            const boxCenter = localBoundingBox.getCenter(new THREE.Vector3());
    
            // Create a new mesh using the size and center of the bounding box
            const boxGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
            const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
            const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
            boxMesh.position.copy(boxCenter);
    
            // Add the new mesh to the scene
            this.scene.add(boxMesh);
    
            // Store the new mesh in the independentMeshes array
            this.independentMeshes.push(boxMesh);
        });
    }

    clearTempBoundingBoxVisuals() {
        this.tempBoundingBoxVisuals.forEach((boxMesh) => {
            this.scene.remove(boxMesh);
        });
        this.tempBoundingBoxVisuals = [];
    }

    visualizeBoundingBox(boundingBox, color) {
        const boxSize = boundingBox.getSize(new THREE.Vector3());
        const boxCenter = boundingBox.getCenter(new THREE.Vector3());
        const boxGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
        const boxMaterial = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boxMesh.position.copy(boxCenter);
        this.scene.add(boxMesh);
        this.tempBoundingBoxVisuals.push(boxMesh);
    }
    
    checkSelfCollisions() {
        // Recompute bounding boxes for each mesh in the robot
        this.createIndependentMeshesFromBoundingBoxes();
        const updatedBoundingBoxes = new Map();
        console.log(this.boundingBoxes);
        this.boundingBoxes.forEach((mesh, key) => {
            // Ensure world matrix is updated
            mesh.updateMatrixWorld(true);
            
            // Compute local bounding box
            const localBoundingBox = new THREE.Box3().setFromObject(mesh);
        
            // Visualize the bounding box before transformation (in red)
            this.visualizeBoundingBox(localBoundingBox.clone(), 0xff0000);
        
            // Print the bounding box before transformation
            console.log("Before:", localBoundingBox);
        
            // Apply the world matrix to the bounding box
            localBoundingBox.applyMatrix4(mesh.matrixWorld);
        
            // Visualize the bounding box after transformation (in green)
            this.visualizeBoundingBox(localBoundingBox, 0x00ff00);
        
            // Print the bounding box after transformation
            console.log("After:", localBoundingBox);
        
            // Add the transformed bounding box to the updatedBoundingBoxes map
            updatedBoundingBoxes.set(key, localBoundingBox);
        });
    
        // Check for collisions between bounding boxes
        let collisionDetected = false;
        const keys = Array.from(updatedBoundingBoxes.keys());
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                if (updatedBoundingBoxes.get(keys[i]).intersectsBox(updatedBoundingBoxes.get(keys[j]))) {
                    // console.log(`Collision detected between ${keys[i]} and ${keys[j]}`);
                    collisionDetected = true;
                }
            }
        }
    
        this.clearTempBoundingBoxVisuals();
    
        // Create and display new temporary visuals
        updatedBoundingBoxes.forEach((boundingBox) => {
            const boxSize = boundingBox.getSize(new THREE.Vector3());
            const boxCenter = boundingBox.getCenter(new THREE.Vector3());
            const boxGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
            const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
            const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
            boxMesh.position.copy(boxCenter);
            this.scene.add(boxMesh);
            this.tempBoundingBoxVisuals.push(boxMesh);
        });
    
        return collisionDetected;
    }
    
    

    // 257, 289.5, 0
    forwardKinematics() {
        let jointAngles = this.getJointAngles();
        // Initialize the transformation matrix as an identity matrix (4x4)
        let transformMatrix = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];

        // Calculate the overall transformation matrix
        for (let i = 0; i < 6; i++) {
            const DHParameters = {
                d: this.DHParameters[i].d,
                a: this.DHParameters[i].a,
                theta: jointAngles[i] + this.DHParameters[i].theta,
                alpha: this.DHParameters[i].alpha
            };

            const nextTransformMatrix = this.getTransformationMatrix(DHParameters);
            transformMatrix = this.multiplyMatrices(transformMatrix, nextTransformMatrix);
        }

        // Extract the position from the final transformation matrix
        const position = new THREE.Vector3(transformMatrix[0][3], transformMatrix[2][3], -transformMatrix[1][3]);

        const yaw = Math.atan2(transformMatrix[2][0], transformMatrix[0][0]);
        const pitch = Math.atan2(-transformMatrix[1][0], Math.sqrt(Math.pow(transformMatrix[1][1], 2) + Math.pow(transformMatrix[1][2], 2)));
        const roll = Math.atan2(transformMatrix[1][1], transformMatrix[1][2]);
        const xAxis = new THREE.Vector3(transformMatrix[0][0], transformMatrix[0][2], transformMatrix[0][1]);
        const yAxis = new THREE.Vector3(transformMatrix[1][0], transformMatrix[1][2], transformMatrix[1][1]);
        const zAxis = new THREE.Vector3(transformMatrix[2][0], transformMatrix[2][2], transformMatrix[2][1]);

        const orientation = new THREE.Euler(roll, pitch, yaw, 'XYZ');
        // Return the position and orientation
        return  { position, orientation };

    }

    rotateJoint(target) {
        let alpha = 0.1;
        // for (let i = 1; i < 7; i++) {
        //     let object = this.robotJointMap.get(`j${i}`);
        //     object.rotation.z += alpha* (target[i-1]-object.rotation.z);
        // }
        for (let i = 1; i < 7; i++) {
            let object = this.robotJointMap.get(`j${i}`);
            object.rotation.z = target[i-1];
        }
    }
    update() { // animate();
        function styleData(data){
            return data.toFixed(1);
        }
        function toDegrees(radians) {
            if ((radians * (180 / Math.PI)))
            return (radians * (180 / Math.PI)).toFixed(1);
        }

        document.getElementById("1").innerHTML = "X: " + styleData(this.forwardKinematics().position.x);
        document.getElementById("2").innerHTML = " Y: " + styleData(this.forwardKinematics().position.y);
        document.getElementById("3").innerHTML = " Z: " + styleData(this.forwardKinematics().position.z);
        document.getElementById("4").innerHTML = "X: " + styleData(this.forwardKinematics().orientation.x);
        document.getElementById("5").innerHTML = " Y: " + styleData(this.forwardKinematics().orientation.y);
        document.getElementById("6").innerHTML = " Z: " + styleData(this.forwardKinematics().orientation.z);
    }
}
