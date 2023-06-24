import * as THREE from "three";
import Experience from "../Experience.js";

// import Floor from "./Floor.js";
import Controls from "./Controls.js";
import Environment from "./Environment.js";


export default class Room {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.room = this.resources.items.room;
        this.room2 = this.resources.items.room2;
        this.actualRoom = this.room.scene;

        this.setModel();
 
    }
    setModel() {
        //this.scene.add(this.room.scene);
        this.scene.add(this.room2);
        // this.actualRoom.children.forEach((child) => {
        //     child.castShadow = true;
        //     child.receiveShadow = true;

        //     if (child instanceof THREE.Group) {
        //         child.children.forEach((groupchild) => {
        //             console.log(groupchild.material);
        //             groupchild.castShadow = true;
        //             groupchild.receiveShadow = true;
        //         });
        //     }

        //     // console.log(child);

        //     if (child.name === "Aquarium") {
        //         // console.log(child);
        //         child.children[0].material = new THREE.MeshPhysicalMaterial();
        //         child.children[0].material.roughness = 0;
        //         child.children[0].material.color.set(0x549dd2);
        //         child.children[0].material.ior = 3;
        //         child.children[0].material.transmission = 1;
        //         child.children[0].material.opacity = 1;
        //         child.children[0].material.depthWrite = false;
        //         child.children[0].material.depthTest = false;
        //     }

        //     if (child.name === "Computer") {
        //         child.children[1].material = new THREE.MeshBasicMaterial({
        //             map: this.resources.items.screen,
        //         });
        //     }

        //     if (child.name === "Mini_Floor") {
        //         child.position.x = -0.289521;
        //         child.position.z = 8.83572;
        //     }

        //     // if (
        //     //     child.name === "Mailbox" ||
        //     //     child.name === "Lamp" ||
        //     //     child.name === "FloorFirst" ||
        //     //     child.name === "FloorSecond" ||
        //     //     child.name === "FloorThird" ||
        //     //     child.name === "Dirt" ||
        //     //     child.name === "Flower1" ||
        //     //     child.name === "Flower2"
        //     // ) {
        //     //     child.scale.set(0, 0, 0);
        //     // }

        //     child.scale.set(0, 0, 0);
        //     if (child.name === "Cube") {
        //         // child.scale.set(1, 1, 1);
        //         child.position.set(0, -1, 0);
        //         child.rotation.y = Math.PI / 4;
        //     }

        //     this.roomChildren[child.name.toLowerCase()] = child;
        // });

        // const width = 0.5;
        // const height = 0.7;
        // const intensity = 1;
        // const rectLight = new THREE.RectAreaLight(
        //     0xffffff,
        //     intensity,
        //     width,
        //     height
        // );
        // rectLight.position.set(7.68244, 7, 0.5);
        // rectLight.rotation.x = -Math.PI / 2;
        // rectLight.rotation.z = Math.PI / 4;
        // this.actualRoom.add(rectLight);

        // this.roomChildren["rectLight"] = rectLight;

        // // const rectLightHelper = new RectAreaLightHelper(rectLight);
        // // rectLight.add(rectLightHelper);
        // // console.log(this.room);

        // this.scene.add(this.actualRoom);
        // this.actualRoom.scale.set(0.11, 0.11, 0.11);
    }
    resize() {}

    update() {}
}
