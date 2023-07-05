import * as THREE from "three";
import Experience from "../Experience.js";

import Room from "./Room.js";
import Floor from "./Floor.js";
import Controls from "./Controls.js";
import Environment from "./Environment.js";
import Robot from "./Robot.js";
import {EventEmitter} from "events";

export default class World extends EventEmitter {
    constructor() {
        super();
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.camera = this.experience.camera;
        this.resources = this.experience.resources;
        this.animator = this.experience.animator;
        this.controls = this.experience.controls;
        this.resources.on("ready", () => {
            this.environment = new Environment();
            this.floor = new Floor();
            this.room = new Room();
            this.robot = new Robot();
            this.emit("worldready");
        });

    }


    resize() {}

    update() {
        if (this.robot) {
            this.robot.update();
        }
        if (this.controls) {
            this.controls.update();
        }
        if (this.animator) {
            this.animator.update();
        }
    }
}
