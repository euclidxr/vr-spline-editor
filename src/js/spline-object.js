import { random } from "lodash";
import { BoxBufferGeometry, Mesh, MeshLambertMaterial, Vector3 } from "three";
import { generateRandomColor } from "./utils";

const material = new MeshLambertMaterial({
    opacity:0.8,

});
const geometry = new BoxBufferGeometry(0.1,0.1,0.1);

export class SplineObject extends Mesh{
    constructor(props={}){
        super(geometry,material)
        const {color = generateRandomColor() ,position = new Vector3(random(-2,2),random(0.5,1.5),random(-0.9,-0.5)),onUpdate =() => {},collisionEnd=() => {}} = props;
        this.material = material.clone();
        this.material.color = color;
        this.position.copy(position);
        this.castShadow = true;
        this.receiveShadow = true;
        console.log(onUpdate);
        this.onUpdate = onUpdate;
        this.collisionEnd = collisionEnd;
    }

    update = (controller) => {
        // controller.add(this);
        console.log('updated');
        this.material.transparent = true;
        this.scale.set(1.1,1.1,1.1)
        this.position.copy(controller.position);
        this.onUpdate(this.position);
    }

    onSelect = (controller) => {
        this.material.transparent = true;
        this.scale.set(1.1,1.1,1.1);
        // controller.add(this);
        this.position.copy(controller.position);
    }

    onSelectEnd = (controller) => {
        this.material.transparent = false;
        this.scale.set(1,1,1);
        this.position.copy(controller.position)
        // controller.remove(this);
    }

    onCollision = (grip) => {
        this.position.copy(grip.position);
        // this.rotation.copy(grip.rotation);
        this.material.transparent = true;
        this.scale.set(1.1,1.1,1.1)
    }

    onCollisionEnd = (grip) => {
        this.material.transparent = false;
        this.scale.set(1,1,1);
        this.position.copy(grip.position);
        this.collisionEnd(this,grip);
    }

    setPositon = (position) => {
        this.position.copy(position);
    }

    destroy = () => {
        this.parent.remove(this);
        this.material.dispose();
        this.geometry.dispose();
    }
}