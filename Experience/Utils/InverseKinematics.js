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
                a: 35, // Link length (in milimeters) Distance from axis of rotation of current joint to next joint
                d: 87, // Link offset (in milimeters) Distance along axis of rotation from current joint to next joint 
                offset: 0 // Offset (eccentricity) of link 1 from the axis of rotation (in milimeters)
            },
            // Link 2 (Joint 1 to Joint 2)
            {
                a: 0,
                d: 147.25,
                offset: 0
            },
            // Link 3 (Joint 2 to Joint 3)
            {
                a: 0,
                d: 55.5,
                offset: 0
            },
            // Link 4 (Joint 3 to Joint 4)
            {
                a: 152,
                d: 0,
                offset: 0
            },
            // Link 5 (Joint 4 to Joint 5)
            {
                a: -6,
                d: 0,
                offset: 0
            },
            // Link 6 (Joint 5 to End Effector)
            {
                a: 76,
                d: 0,
                offset: 0
            },
        ];

        // Joint limits ((min and max angles in radians))
        this.jointLimits = [
            {
                min: 0,
                max: Math.PI
            },
            { // Joint 1 limits
                min: -Math.PI / 2,
                max: Math.PI / 2
            },
            { // Joint 2 limits
                min: -Math.PI / 2,
                max: Math.PI / 2
            },
            { // Joint 3 limits
                min: -Math.PI / 2,
                max: Math.PI / 2
            }, { // Joint 4 limits
                min: -Math.PI / 2,
                max: Math.PI / 2
            }, { // Joint 5 limits
                min: -Math.PI / 2,
                max: Math.PI / 2
            }, { // Joint 6 limits
                min: -Math.PI / 2,
                max: Math.PI / 2
            },
        ];
    }

    addIKGUI() {
        let IKToolBar = this.toolBar.addFolder("IK Tools");
        let IK = this;
        const tools = {
            calculateFK() {
                console.log(IK.forwardKinematics());
            }
        }
        IKToolBar.add(tools, "calculateFK");
    }

    addHelperTools() {
        for (let i = 1; i < 7; i++) {
            let object = this.robotJointMap.get(`j${i}`);
            const axesHelper = new THREE.AxesHelper(100);
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
        let alphas = this.getTwistAngles();
        // Initialize the transformation matrix as an identity matrix (4x4)
        let T_total = numeric.identity(4);

        // Loop through each joint
        for (let i = 0; i < this.DHParameters.length; i++) {
            const {a, d, offset} = this.DHParameters[i];
            const theta = thetas[i];
            // Compute the transformation matrix for the current joint i
            const T_current = numeric.dot(numeric.dot(numeric.dot(numeric.dot(numeric.dot(numeric.dot(T_total, this.rotationMatrixZ(theta + offset)), this.translationMatrix(0, 0, d)), this.translationMatrix(a, 0, 0)), numeric.identity(4) // No need for rotation about the X-axis since alpha is removed from DH parameters
            ), numeric.identity(4)), numeric.identity(4));

            // Update the total transformation matrix
            T_total = T_current;
        }

        // Extract the position and orientation from the final transformation matrix
        const position = [
            T_total[0][3],
            T_total[2][3],
            T_total[1][3]
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
