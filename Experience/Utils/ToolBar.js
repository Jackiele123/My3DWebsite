import {GUI} from 'lil-gui'
import {EventEmitter} from "events";
import Experience from '../Experience';

export default class ToolBar extends EventEmitter {
    constructor() {
        super();

        this.experience = new Experience();
        this.renderer = this.experience.renderer;
        this.scene = this.experience.scene;
        this.camera = this.experience.camera;
        
        this.resources = this.experience.resources;
        this.robot = this.resources.items.robot;
        this.components = this.robot.children[0];

        this.ToolBar = new GUI();
        
        const robotFolder = this.ToolBar.addFolder('Robot')
        robotFolder.add(this.components.rotation, 'x', 0, Math.PI * 2);
        robotFolder.add(this.components.rotation, 'y', 0, Math.PI * 2);
        robotFolder.add(this.components.rotation, 'z', 0, Math.PI * 2);
        robotFolder.open();
        const cameraFolder = this.ToolBar.addFolder('Camera');
        cameraFolder.add(this.camera.position, 'z', 0, 10);
        cameraFolder.open();
    }

}
