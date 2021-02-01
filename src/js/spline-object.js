import {
    random
} from "lodash";
import {
    BoxBufferGeometry,
    Mesh,
    MeshLambertMaterial,
    Vector3
} from "three";
import {
    generateRandomColor
} from "./utils";

const material = new MeshLambertMaterial({
    opacity: 0.8,

});
const geometry = new BoxBufferGeometry(0.1, 0.1, 0.1);

export class SplineObject extends Mesh {
    constructor(props = {}) {
        super(geometry, material);
        this.scale.set(0,0,0);
        const {
            color = generateRandomColor(), position = new Vector3(random(-1, 1), random(0.5, 0.8), random(-0.3, -0.1)), onUpdate = () => {}, selectionEnd = () => {}
        } = props;
        this.material = material.clone();
        this.material.color = color;
        this.position.copy(position);
        this.castShadow = true;
        this.receiveShadow = true;
        this.onUpdate = onUpdate;
        this.selectionEnd = selectionEnd;
        this.runAddAnimation();
    }

    runAddAnimation = () => {
        let scaleIndex = 0;
        this.intervalId = setInterval(() => {
            if(scaleIndex >= 1){
                clearInterval(this.intervalId);
            }
            else{
            scaleIndex +=0.2;
            this.scale.set(scaleIndex,scaleIndex,scaleIndex);
            }
        },100)
    }

    runDestroyAnimation = (cb) => {
        let scaleIndex = 1;
        this.destIntervalId = setInterval(() => {
            if(scaleIndex <= 0){
                clearInterval(this.destIntervalId);
                cb();
            }
            else{
                scaleIndex -=0.2;
                this.scale.set(scaleIndex,scaleIndex,scaleIndex);
            }
        },100)
    }

    update = (controller) => {
        this.material.transparent = true;
        this.scale.set(1.1, 1.1, 1.1)
        this.position.copy(controller.position);
        this.onUpdate(this.position);
    }

    onSelect = (controller) => {
        this.material.transparent = true;
        this.scale.set(1.1, 1.1, 1.1);
        // controller.add(this);
        this.position.copy(controller.position);
    }

    onSelectEnd = (controller) => {
        this.material.transparent = false;
        this.scale.set(1, 1, 1);
        this.position.copy(controller.position);
        this.selectionEnd(this,controller);
    }

    setPositon = (position) => {
        this.position.copy(position);
    }

    destroy = () => {
        this.runDestroyAnimation(() => {
            this.parent.remove(this);
            this.material.dispose();
            this.geometry.dispose();
        });
    }
}