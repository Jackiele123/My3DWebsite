import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import "../../style.css";

import {EventEmitter} from "events";
import Experience from "../Experience.js"
import GSAP from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger.js";
import ASScroll from "@ashthornton/asscroll";


export default class Animator extends EventEmitter {
    constructor() {
        super();

        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.renderer = this.experience.renderer;
        this.camera = this.experience.camera;
        this.canvas = this.experience.canvas;
        this.time = this.experience.time;

        this.animator();
    }

    animator() {
    }


    update() {
    }
}
