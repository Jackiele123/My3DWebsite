import * as THREE from "three";
import Experience from "../Experience.js";
import GSAP from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import ASScroll from "@ashthornton/asscroll";

export default class Controls {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.sizes = this.experience.sizes;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.camera = this.experience.camera;
        this.robot = this.experience.world.robot.robot;
        this.toolBar = this.experience.toolBar;
        this.rectLight = this.experience.world.robot.rectLight;
        this.circleFirst = this.experience.world.floor.circleFirst;
        this.circleSecond = this.experience.world.floor.circleSecond;
        this.circleThird = this.experience.world.floor.circleThird;

        
        GSAP.registerPlugin( ScrollTrigger );

        if ( !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent ) ) {
            this.setSmoothScroll();
        }
        this.setScrollTrigger();


        // this.setPath();
        // this.travel = new travelLookingAtCurve(this.camera.orthographicCamera, this.curve, this.robot);
    }

    setPath() {
        this.curve = new THREE.CatmullRomCurve3( [
            new THREE.Vector3( -10, 5, 0 ), new THREE.Vector3( 0, 10, -10 ), new THREE.Vector3( 10, 15, 0 ), new THREE.Vector3( 0, 10, 10 )
        ], true );

        const points = this.curve.getPoints( 50 );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

        // Create the final object to add to the scene
        const curveObject = new THREE.Line( geometry, material );
        this.scene.add( curveObject );
    }

    setupASScroll() { // https://github.com/ashthornton/asscroll
        const asscroll = new ASScroll( { ease: 0.1, disableRaf: true } );

        GSAP.ticker.add( asscroll.update );

        ScrollTrigger.defaults( { scroller: asscroll.containerElement } );

        ScrollTrigger.scrollerProxy( asscroll.containerElement, { scrollTop( value ) {
                if ( arguments.length ) {
                    asscroll.currentPos = value;
                    return;
                }
                return asscroll.currentPos;
            }, getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            }, fixedMarkers: true } );

        asscroll.on( "update", ScrollTrigger.update );
        ScrollTrigger.addEventListener( "refresh", asscroll.resize );

        requestAnimationFrame( () => {
            asscroll.enable( { newScrollElements: document.querySelectorAll( ".gsap-marker-start, .gsap-marker-end, [asscroll]" ) } );
        } );
        return asscroll;
    }

    setSmoothScroll() {
        this.asscroll = this.setupASScroll();
    }

    setScrollTrigger() {
        ScrollTrigger.matchMedia( { // Desktop
            "(min-width: 969px)": () => { // First section -----------------------------------------
                this.firstMoveTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".first-move", start: "top top", end: "bottom bottom", scrub: 0.6,
                        // markers: true,
                        invalidateOnRefresh: true } } )
                this.firstMoveTimeline.to( this.robot.rotation, { y: -Math.PI / 1.8 } )

                this.firstMoveTimeline.to( this.robot.position, { x: 2.5, y: 0, z: 0 }, "<" );
                // Second section -----------------------------------------
                this.secondMoveTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".second-move", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } } ).to( this.robot.rotation, { y: 0 } ).to( this.robot.position, { x: -2, z: 2 }, "<" )

                // Third section -----------------------------------------
                this.thirdMoveTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".third-move", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } } ).to( this.robot.position, { x: 2 } );
            },

            // -----------------------------------Mobile-----------------------------------
            "(max-width: 968px)": () => {
                // console.log("fired mobile");
                // First section -----------------------------------------
                this.firstMoveTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".first-move", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } } ).to( this.robot.rotation, { y: Math.PI / 2 }, "same" )

                // Second section -----------------------------------------
                this.secondMoveTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".second-move", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } } ).to( this.robot.scale, { x: 0.01, y: 0.01, z: 0.01 }, "same" ).to( this.robot.position, { x: 1.5 }, "same" );

                // Third section -----------------------------------------
                this.thirdMoveTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".third-move", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } } ).to( this.robot.position, { z: -4.5 } );
            },

            // -----------------------------all---------------------------------------
            all: () => {
                this.sections = document.querySelectorAll( ".section" );
                this.sections.forEach( ( section ) => {
                    this.progressWrapper = section.querySelector( ".progress-wrapper" );
                    this.progressBar = section.querySelector( ".progress-bar" );

                    if ( section.classList.contains( "right" ) ) {
                        GSAP.to( section, { borderTopLeftRadius: 10, scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: 0.6 } } );
                        GSAP.to( section, { borderBottomLeftRadius: 700, scrollTrigger: { trigger: section, start: "bottom bottom", end: "bottom top", scrub: 0.6 } } );
                    } else {
                        GSAP.to( section, { borderTopRightRadius: 10, scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: 0.6 } } );
                        GSAP.to( section, { borderBottomRightRadius: 700, scrollTrigger: { trigger: section, start: "bottom bottom", end: "bottom top", scrub: 0.6 } } );
                    } GSAP.from( this.progressBar, { scaleY: 0, scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.4, pin: this.progressWrapper, pinSpacing: false } } );
                } );

                // All animations
                // Intro section -----------------------------------------
                this.introTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".tour-wrapper", start: "top top", end: "bottom bottom", scrub: 0.6 } } ).to( this.robot.rotation, { y: Math.PI * 2 }, );
                // First section -----------------------------------------
                this.firstCircle = new GSAP.timeline( { scrollTrigger: { trigger: ".first-move", start: "top top", end: "bottom bottom", scrub: 0.6 } } ).to( this.circleFirst.scale, { x: 3, y: 3, z: 3 } );

                // Second section -----------------------------------------
                this.secondCircle = new GSAP.timeline( { scrollTrigger: { trigger: ".second-move", start: "top top", end: "bottom bottom", scrub: 0.6 } } ).to( this.circleSecond.scale, { x: 3, y: 3, z: 3 }, "same" ).to( this.robot.position, { y: 0.7 }, "same" );

                // Third section -----------------------------------------
                this.thirdCircle = new GSAP.timeline( { scrollTrigger: { trigger: ".third-move", start: "top top", end: "bottom bottom", scrub: 0.6 } } ).to( this.circleThird.scale, { x: 3, y: 3, z: 3 } );

                // Mini Platform Animations
                this.secondPartTimeline = new GSAP.timeline( { scrollTrigger: { trigger: ".third-move", start: "center center" } } );
                this.secondPartTimeline.add( this.first );
                this.secondPartTimeline.add( this.second );
                this.secondPartTimeline.add( this.third );
                this.secondPartTimeline.add( this.fourth, "-=0.2" );
                this.secondPartTimeline.add( this.fifth, "-=0.2" );
                this.secondPartTimeline.add( this.sixth, "-=0.2" );
                this.secondPartTimeline.add( this.seventh, "-=0.2" );
                this.secondPartTimeline.add( this.eighth );
                this.secondPartTimeline.add( this.ninth, "-=0.1" );
            } } );
    }
    resize() {}
    update() {
        if (!this.experience.presentationMode && this.experience.wasPresentationMode){
            document.querySelector( ".page" ).style.display = "none";
            this.camera.perspectiveCamera.position.copy( this.camera.orthographicCamera.position );
            this.camera.perspectiveCamera.rotation.copy( this.camera.orthographicCamera.rotation );
            this.toolBar.show();
            this.robot.position.copy( new THREE.Vector3(0,0,0));
            this.circleFirst.visible = false;
            this.circleSecond.visible = false;
            this.circleThird.visible = false;
            document.querySelector( ".display" ).style.display = "block";
            this.experience.wasPresentationMode = false;
        }
    }
}

class travelLookingAtCurve {
    constructor( camera, curve, target ) {
        this.camera = camera;
        this.curve = curve;
        this.target = target;
    }
    update() {
        this.camera.position.copy( this.curve.getPointAt( ( this.progress % 1 ) ) );
        this.camera.lookAt( this.target.position );
    }
}
