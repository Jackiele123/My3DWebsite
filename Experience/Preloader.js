import {EventEmitter} from "events";
import Experience from "./Experience.js";
import GSAP from "gsap";
import convert from "./Utils/convertDivsToSpans.js";
import { Vector3 } from "three";

export default class Preloader extends EventEmitter {
    constructor() {
        super();
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.sizes = this.experience.sizes;
        this.resources = this.experience.resources;
        this.camera = this.experience.camera;
        this.time = this.experience.time;
        this.world = this.experience.world;
        this.device = this.sizes.device;

        this.sizes.on("switchdevice", (device) => {
            this.device = device;
        });

        this.world.on("worldready", () => {
            this.setAssets();
            this.playIntro();
        });
    }

    setAssets() {
        convert(document.querySelector(".intro-text"));
        convert(document.querySelector(".hero-main-title"));
        convert(document.querySelector(".hero-main-description"));
        convert(document.querySelector(".hero-second-subheading"));
        convert(document.querySelector(".second-sub"));

        this.robot = this.experience.world.robot.robot;
    }

    firstIntro() {
        return new Promise((resolve) => {
            this.timeline = new GSAP.timeline();
            this.timeline.set(".animatedis", {
                y: 0,
                yPercent: 100
            });
            this.timeline.to(".preloader", {
                opacity: 0,
                delay: 1,
                onComplete: () => {
                    document.querySelector(".preloader").classList.add("hidden");
                }
            });
            if (this.device === "desktop") {
                this.timeline.to(this.robot.scale, {
                    x: .01,
                    y: .01,
                    z: .01,
                    ease: "back.out(2.5)",
                    duration: 0.7
                }).to(this.robot.position, {
                    x: 2,
                    ease: "power1.out",
                    duration: 0.7
                });
            } else {
                this.timeline.to(this.robot.scale, {
                    x: .01,
                    y: .01,
                    z: .01,
                    ease: "back.out(2.5)",
                    duration: 0.7
                }).to(this.robot.position, {
                    z: -1,
                    ease: "power1.out",
                    duration: 0.7
                });
            }
            this.timeline.to(".intro-text .animatedis", {
                yPercent: 0,
                stagger: 0.05,
                ease: "back.out(0.7)"
            }).to(".arrow-svg-wrapper", {
                opacity: 1
            }, "same").to(".toggle-bar", {
                opacity: 1,
                onComplete: resolve
            }, "same");
        });
    }

    secondIntro() {
        return new Promise((resolve) => {
            this.secondTimeline = new GSAP.timeline();

            this.secondTimeline.to(".intro-text .animatedis", {
                yPercent: 100,
                stagger: 0.05,
                ease: "back.in(1.7)"
            }, "fadeout").to(".arrow-svg-wrapper", {
                opacity: 0
            }, "fadeout").to(this.robot.position, {
                x: 0,
                y: 0,
                z: 0,
                ease: "power1.out"
            }, "same").to(this.robot.rotation, {
                y: 2 * Math.PI + Math.PI / 4
            }, "same").to(this.robot.scale, {
                x: .01,
                y: .01,
                z: .01
            }, "same").to(this.camera.orthographicCamera.position, {
                y: 6.5
            }, "same").to(this.robot.position, {
                x: 0,
                y: 0,
                z: 0
            }, "same").set(this.robot.scale, {
                x: .01,
                y: .01,
                z: .01
            }).to(this.robot.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1
            }, "introtext").to(".hero-main-title .animatedis", {
                yPercent: 0,
                stagger: 0.07,
                ease: "back.out(1.7)"
            }, "introtext").to(".hero-main-description .animatedis", {
                yPercent: 0,
                stagger: 0.07,
                ease: "back.out(1.7)"
            }, "introtext").to(".first-sub .animatedis", {
                yPercent: 0,
                stagger: 0.07,
                ease: "back.out(1.7)"
            }, "introtext").to(".second-sub .animatedis", {
                yPercent: 0,
                stagger: 0.07,
                ease: "back.out(1.7)"
            }, "introtext").to(".arrow-svg-wrapper", {
                opacity: 1,
                onComplete: resolve
            },);
        });
    }

    onScroll(e) {
        if (e.deltaY > 0) {
            this.removeEventListeners();
            this.playSecondIntro();
        }
    }

    onTouch(e) {
        this.initalY = e.touches[0].clientY;
    }

    onTouchMove(e) {
        let currentY = e.touches[0].clientY;
        let difference = this.initalY - currentY;
        if (difference > 0) {
            console.log("swipped up");
            this.removeEventListeners();
            this.playSecondIntro();
        }
        this.intialY = null;
    }

    removeEventListeners() {
        window.removeEventListener("wheel", this.scrollOnceEvent);
        window.removeEventListener("touchstart", this.touchStart);
        window.removeEventListener("touchmove", this.touchMove);
    }

    async playIntro() {
        this.scaleFlag = true;
        await this.firstIntro();
        this.moveFlag = true;
        this.scrollOnceEvent = this.onScroll.bind(this);
        this.touchStart = this.onTouch.bind(this);
        this.touchMove = this.onTouchMove.bind(this);
        window.addEventListener("wheel", this.scrollOnceEvent);
        window.addEventListener("touchstart", this.touchStart);
        window.addEventListener("touchmove", this.touchMove);
    }
    async playSecondIntro() {
        this.moveFlag = false;
        await this.secondIntro();
        this.scaleFlag = false;
        this.emit("enablecontrols");
    }

    move() {
        if (this.device === "desktop") {
            this.robot.position.set(2, 0, 0);
        } else {
            this.robot.position.set(0, 0, -1);
        }
    }

    scale() {

        if (this.device === "desktop") {
            this.robot.scale.set(0.01, 0.01, 0.01);
        } else {
            this.robot.scale.set(0.007, 0.007, 0.007);
        }
    }

    update() {
        if (this.moveFlag) {
            this.move();
        }

        if (this.scaleFlag) {
            this.scale();
        }
    }
}
