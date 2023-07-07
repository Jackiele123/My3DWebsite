import * as THREE from "three";
import Experience from "./Experience.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

export default class Camera {
    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.time = this.experience.time;
        this.currentCamera;


        this.createPerspectiveCamera();
        this.createOrthographicCamera();
        this.setOrbitControls();
    }

    createPerspectiveCamera() {
        this.perspectiveCamera = new THREE.PerspectiveCamera(35, this.sizes.aspect, 0.1, 1000);
        this.perspectiveCamera.position.x = 29;
        this.perspectiveCamera.position.y = 14;
        this.perspectiveCamera.position.z = 12;
        this.scene.add(this.perspectiveCamera);
    }

    createOrthographicCamera() {
        this.orthographicCamera = new THREE.OrthographicCamera((-this.sizes.aspect * this.sizes.frustrum) / 2, (this.sizes.aspect * this.sizes.frustrum) / 2, this.sizes.frustrum / 2, -this.sizes.frustrum / 2, -50, 50);

        this.orthographicCamera.position.y = 5.65;
        this.orthographicCamera.position.z = 10;
        this.orthographicCamera.rotation.x = -Math.PI / 6;

        this.scene.add(this.orthographicCamera);
        if (true) {
            const size = 10;
            const divisions = 10;
            const gridHelper = new THREE.GridHelper(size, divisions);
            this.scene.add(gridHelper);

            const axesHelper = new THREE.AxesHelper(10);
            this.scene.add(axesHelper);
            this.helper = new THREE.CameraHelper(this.orthographicCamera);
            this.scene.add(this.helper);
        }
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.perspectiveCamera, document.querySelector(".hero"));
        // this.controls.enableDamping = true;
        // this.controls.enableZoom = true;
    }

    resize() { // Updating Perspective Camera on Resize
        this.perspectiveCamera.aspect = this.sizes.aspect;
        this.perspectiveCamera.updateProjectionMatrix();

        // Updating Orthographic Camera on Resize
        this.orthographicCamera.left = (-this.sizes.aspect * this.sizes.frustrum) / 2;
        this.orthographicCamera.right = (this.sizes.aspect * this.sizes.frustrum) / 2;
        this.orthographicCamera.top = this.sizes.frustrum / 2;
        this.orthographicCamera.bottom = -this.sizes.frustrum / 2;
        this.orthographicCamera.updateProjectionMatrix();
    }

    rotateCamera(camera, target_position, camera_speed, offset) {
        var camera_offset = {
            x: offset,
            y: offset,
            z: offset
        };
        if (camera == "perspectiveCamera") {
            this.perspectiveCamera.position.x = target_position.x + camera_offset.x * (Math.sin(this.time.current * camera_speed));
            this.perspectiveCamera.position.z = target_position.z + camera_offset.z * (Math.cos(this.time.current * camera_speed));
            this.perspectiveCamera.position.y = target_position.y + camera_offset.y;
            this.perspectiveCamera.lookAt(target_position.x, target_position.y, target_position.z);
        }
        if (camera == "orthographicCamera") {
            this.orthographicCamera.position.x = target_position.x + camera_offset.x * (Math.sin(this.time.current * camera_speed));
            this.orthographicCamera.position.z = target_position.z + camera_offset.z * (Math.cos(this.time.current * camera_speed));
            this.orthographicCamera.position.y = target_position.y + camera_offset.y;
            this.orthographicCamera.lookAt(target_position.x, target_position.y, target_position.z);

        }
    }

    update() { // console.log(this.perspectiveCamera.position);
        this.controls.update();

        // this.helper.matrixWorldNeedsUpdate = true;
        // this.helper.update();
        // this.helper.position.copy(this.orthographicCamera.position);
        // this.helper.rotation.copy(this.orthographicCamera.rotation);
    }
}
