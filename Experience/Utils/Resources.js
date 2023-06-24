import * as THREE from "three";

import {EventEmitter} from "events";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {ThreeMFLoader} from "three/examples/jsm/loaders/3MFLoader.js";

import Experience from "../Experience.js"

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

        this.groups = {};

        this.setLoaders();
        this.startLoading();
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
                    file.scale.set(0.03, 0.03, 0.03);
                    file.traverse(function (child) {
                        child.castShadow = true;
                    });
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
