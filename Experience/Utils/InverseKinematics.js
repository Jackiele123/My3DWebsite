import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import GUI from "lil-gui";
import numeric from "numeric";

import {EventEmitter} from "events";
import Experience from "../Experience.js"

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
                theta: 0,
                alpha: 0
            },
            // Link 3 (Joint 2 to Joint 3)
            {
                d: 0,
                a: 55.5,
                theta: Math.PI / 2,
                alpha: 0
            },
            // Link 4 (Joint 3 to Joint 4)
            {
                d: 142,
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
                d: 76,
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
                console.log(IK.forwardKinematics());
            },
            addHelperTools() {
                let object = IK.robotJointMap.get(`j${this.joint}`);
                if (object !== undefined) 
                    object.add(axesHelper);
            },
            DeleteHelperTools() {
                axesHelper.removeFromParent();
            }
        }
        IKToolBar.add(tools, "joint", 1, 6).name("Joint Number");
        IKToolBar.add(tools, "calculateFK");
        IKToolBar.add(tools, "addHelperTools");
        IKToolBar.add(tools, "DeleteHelperTools");
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

    // Function to create a 4x4 rotation matrix for rotation about the Z-axis (theta in radians)
    rotationMatrixZ(theta) {
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        return [
            [
                cosTheta, - sinTheta,
                0,
                0
            ],
            [
                sinTheta, cosTheta, 0, 0
            ],
            [
                0, 0, 1, 0
            ],
            [
                0, 0, 0, 1
            ],
        ];
    }
    // Function to create a 4x4 rotation matrix for rotation about the X-axis (alpha in radians)
    rotationMatrixX(alpha) {
        const cosAlpha = Math.cos(alpha);
        const sinAlpha = Math.sin(alpha);
        return [
            [
                1, 0, 0, 0
            ],
            [
                0,
                cosAlpha, - sinAlpha,
                0
            ],
            [
                0, sinAlpha, cosAlpha, 0
            ],
            [
                0, 0, 0, 1
            ],
        ];
    }

    // Function to create a 4x4 translation matrix
    translationMatrix(dx, dy, dz) {
        return [
            [
                1, 0, 0, dx
            ],
            [
                0, 1, 0, dy
            ],
            [
                0, 0, 1, dz
            ],
            [
                0, 0, 0, 1
            ],
        ];
    }

    forwardKinematics() {
        let thetas = this.getJointAngles();
        // Initialize the transformation matrix as an identity matrix (4x4)
        let T_total = numeric.identity(4);

        // Loop through each joint
        for (let i = 0; i < this.DHParameters.length; i++) {
            const {d, a, theta, alpha} = this.DHParameters[i];
            const t_theta = theta + thetas[i];
            // Compute the transformation matrix for the current joint i
            const t_current = numeric.dot(numeric.dot(numeric.dot(numeric.dot(numeric.dot(numeric.dot(this.translationMatrix(0, 0, d), this.rotationMatrixZ(t_theta)), this.translationMatrix(a, 0, 0)), this.rotationMatrixX(alpha)), numeric.identity(4)), numeric.identity(4)), numeric.identity(4));

            // Update the total transformation matrix
            T_total = numeric.dot(T_total,t_current);
        }

        // Extract the position and orientation from the final transformation matrix
        const position = [
            T_total[0][3],
            T_total[1][3],
            T_total[2][3]
        ];
        const roll = Math.atan2(T_total[2][1], T_total[2][2]);
        const pitch = Math.atan2(- T_total[2][0], Math.sqrt(T_total[2][1] ** 2 + T_total[2][2] ** 2));
        const yaw = Math.atan2(T_total[1][0], T_total[0][0]);

        // Return the result as an object
        return {
            position: position,
            orientation: [roll, pitch, yaw]
        };
    }
    update() { // animate();

    }
}
