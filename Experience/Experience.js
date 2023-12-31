import * as THREE from "three";
import GUI from "lil-gui";

import Sizes from "./Utils/Sizes.js"
import Time from "./Utils/Time.js";
import Resources from "./Utils/Resources.js";
import assets from "./Utils/assets.js";
import Animator from "./Utils/Animator.js";

import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import Theme from "./Theme.js";
import Preloader from "./Preloader.js";

import Controls from "./World/Controls.js";
import World from "./World/World.js";



export default class Experience {
    static instance 
    constructor(canvas) {
        if (Experience.instance) 
            return Experience.instance

        Experience.instance = this;
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.time = new Time();
        this.sizes = new Sizes();
        this.camera = new Camera();
        this.renderer = new Renderer();
        this.animator = new Animator();
        this.resources = new Resources(assets);
        this.theme = new Theme();
        this.world = new World();
        this.toolBar = new GUI({width: 250})
        this.toolBar.hide();
        this.devMode = false;
        this.presentationMode = true;
        this.wasPresentationMode = true;
        // this.controls = new Controls();
        this.preloader = new Preloader();
        this.preloader.on("enablecontrols", () => {
            this.controls = new Controls();
        });

        this.sizes.on("resize", () => {
            this.resize();
        });

        this.time.on("update", () => {
            this.update();
        });

        document.querySelector(".control-button").addEventListener('click', () => {this.presentationMode = !this.presentationMode;});
    }

    resize() {
        this.camera.resize();
        this.world.resize();
        this.renderer.resize();
    }

    update() { 
        // this.preloader.update();
        this.camera.update();
        this.world.update();
        this.renderer.update();
        if (this.controls) {
            this.controls.update();
        }
    }
}
