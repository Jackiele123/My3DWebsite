import {EventEmitter} from "events";
import Experience from "./Experience.js";
import GSAP from "gsap";
import convert from "./Utils/convertDivsToSpans.js";
import {Vector3} from "three";

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

    skipIntro() {
        return new Promise((resolve) => {
            this.timeline = new GSAP.timeline();
            this.timeline.set(".animatedis", {yPercent: 100});
            this.timeline.to(".intro-text .animatedis", {
                yPercent: 100
            }, "fadeout").to(".arrow-svg-wrapper", {
                opacity: 0
            }, "fadeout").to(this.robot.position, {
                x: 0,
                y: 0,
                z: 0
            }, "same").to(this.robot.scale, {
                x: .01,
                y: .01,
                z: .01
            }, "same").to(".tour-main-title .animatedis", {
                yPercent: 0
            }, "introtext").to(".tour-main-description .animatedis", {
                yPercent: 0
            }, "introtext").to(".first-sub .animatedis", {
                yPercent: 0
            }, "introtext").to(".second-sub .animatedis", {
                yPercent: 0
            }, "introtext").to(".arrow-svg-wrapper", {
                opacity: 1,
                onComplete: resolve
            },);
        })
    }
    setAssets() {
        convert(document.querySelector(".intro-text"));
        convert(document.querySelector(".tour-main-title"));
        convert(document.querySelector(".tour-main-description"));
        convert(document.querySelector(".tour-second-subheading"));
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
                delay: .1,
                onComplete: () => {
                    document.querySelector(".preloader").classList.add("hidden");
                }
            });
            if (this.device === "desktop") {
                this.timeline.to(this.robot.scale, {
                    x: .01,
                    y: .01,
                    z: .01,
                    //ease: "back.out(2.5)",
                    //duration: 0.7
                    duration: 0.1
                }).to(this.robot.position, {x: 2});
            } else {
                this.timeline.to(this.robot.scale, {
                    x: .007,
                    y: .007,
                    z: .007,
                    //ease: "back.out(2.5)",
                    //duration: 0.7
                    duration: 0.1
                }).to(this.robot.position, {y: 1.5});
            }
            this.timeline.to(".intro-text .animatedis", {
                yPercent: 0,
                //stagger: 0.05,
                //ease: "back.out(0.7)"
            }).to(".arrow-svg-wrapper", {
                opacity: 1,
                onComplete: resolve
            }, "same");
        });
    }

    secondIntro() {
        return new Promise((resolve) => {
            if (this.experience.devMode) {
                resolve();
            }
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
                y: 0
            }, "same").to(this.robot.scale, {
                x: .01,
                y: .01,
                z: .01
            }, "same").to(this.robot.position, {
                x: 0,
                y: 0,
                z: 0
            }, "same").to(this.robot.rotation, {
                y: 2 *Math.PI,
                ease: "back.out(1.7)",
                duration: 4
            }, "introtext").to(".tour-main-title .animatedis", {
                yPercent: 0,
                stagger: 0.07,
                ease: "back.out(1.7)"
            }, "introtext").to(".tour-main-description .animatedis", {
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
            console.log("swiped up");
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
        // await this.skipIntro();
        this.scaleFlag = false;
        this.emit("enablecontrols");
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
