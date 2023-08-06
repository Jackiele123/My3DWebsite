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
            }
        }

        IKToolBar.add(tools, "calculateFK");
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
