import * as THREE from "three";

import {EventEmitter} from "events";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {ThreeMFLoader} from "three/examples/jsm/loaders/3MFLoader.js";

import Experience from "../Experience.js"
import { mod } from "numeric";

export default class Resources extends EventEmitter {
    constructor(assets) {
        super();

        this.experience = new Experience();
        this.renderer = this.experience.renderer;
        this.scene = this.experience.scene;
        this.assets = assets;
        
        this.items = {};
        this.queue = this.assets.length
        this.loaded = 0;
        this.boundingBoxes = new Map();

        this.setLoaders();
        this.startLoading();
    }

    computeAndVisualizeBoundingBox(model) {
        model.traverse(child => {
            if (child instanceof THREE.Mesh && !child.userData.isBoundingBoxMesh && (child.parent.parent.name.includes("joint") || child.parent.parent.name.includes("basetop"))) {
                let name = child.parent.parent.name;
                let geometry;  // Geometry for the bounding shape
                const boundingBox = new THREE.Box3().setFromObject(child);
                const boxSize = boundingBox.getSize(new THREE.Vector3());
                const boxCenter = boundingBox.getCenter(new THREE.Vector3());

                // Check if the part is circular (based on some criteria, e.g., name)
                if (name.includes("basetop")) {  // Replace "circlePartName" with appropriate criteria
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
                if (name.includes("basetop")){
                    this.boundingBoxes.set('j0', mesh);
                }
                if (name.includes("1")){
                    this.boundingBoxes.set('j1', mesh);
                }
                if (name.includes("2")){
                    this.boundingBoxes.set('j2', mesh);
                }
                if (name.includes("4")){
                    this.boundingBoxes.set('j3', mesh);
                }
                if (name.includes("5")){
                    this.boundingBoxes.set('j4', mesh);
                }
                if (name.includes("6")){
                    this.boundingBoxes.set('j5', mesh);
                }
            }
        });
    }
    
    setLoaders() {
        this.loaders = {};
        this.loaders.gltfLoader = new GLTFLoader();
        this.loaders.dracoLoader = new DRACOLoader();
        this.loaders.threemfLoader = new ThreeMFLoader();
        this.loaders.dracoLoader.setDecoderPath("/draco/");
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
    }

    startLoading() {
        for (const asset of this.assets) {
            if (asset.type === "glbModel") {
                this.loaders.gltfLoader.load(asset.path, (file) => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === "3mf") {
                this.loaders.threemfLoader.load(asset.path, (file) => {
                    file.scale.set(0.001, 0.001, 0.001);
                    file.traverse(function (child) {
                        child.castShadow = true;
                    });
    
                    // Compute and visualize bounding boxes for the loaded .3mf model
                    this.computeAndVisualizeBoundingBox(file);
    
                    this.singleAssetLoaded(asset, file);
                });
            }
        }
    }

    singleAssetLoaded(asset, file) {
        this.items[asset.name] = file;
        this.loaded ++;

        if (this.loaded === this.queue) {
            this.emit("ready");
        }
    }

}
