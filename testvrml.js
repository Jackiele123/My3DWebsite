import * as THREE from 'three';

import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {VRMLLoader} from "three/examples/jsm/loaders/VRMLLoader.js";

let camera,
    scene,
    renderer,
    stats,
    controls,
    loader;

const params = {
    asset: 'test'
};


let vrmlScene;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1e10);
    camera.position.set(- 10, 5, 10);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.add(camera);

    // light

    const ambientLight = new THREE.AmbientLight(0xffffff, .6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, .6);
    dirLight.position.set(- 0, 20, 30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    loader = new VRMLLoader();
    loadAsset(params.asset);

    // renderer

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // controls

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 200;
    controls.enableDamping = true;

    //

    //

    window.addEventListener('resize', onWindowResize);

    //

    // const gui = new GUI();
    // gui.add(params, 'asset', assets).onChange(function (value) {

    //     if (vrmlScene) {

    //         vrmlScene.traverse(function (object) {

    //             if (object.material)
    //                 object.material.dispose();

    //             if (object.material && object.material.map)
    //                 object.material.map.dispose();

    //             if (object.geometry)
    //                 object.geometry.dispose();


    //         });

    //         scene.remove(vrmlScene);

    //     }

    //     loadAsset(value);

    // });

}

function loadAsset(asset) {

    loader.load('models/test2.wrl', function (object) {
        console.log(object);
        object.scale.set(.01, .01, .01);
        object.traverse(function (child) {
            if(child.material)
            console.log(child.material);
            if (child instanceof THREE.Mesh) {
                child.material.color.setHex( 0xff0000 );
            }
            child.castShadow = true;
        });
        vrmlScene = object;
        scene.add(object);
        controls.reset();

    });

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    controls.update(); // to support damping

    renderer.render(scene, camera);

}
