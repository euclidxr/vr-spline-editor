import { Color, Mesh, MeshLambertMaterial, MeshPhongMaterial, SphereBufferGeometry } from "three"
import { OPTIONS } from "./setup";



const material = new MeshPhongMaterial({
    color: 0xff0000,
    emissive:true
});

const geometry = new SphereBufferGeometry(0.01,32,32)

export class OptionMesh extends Mesh {
    constructor(name,color,onSelect = () => {}){
        super(geometry,material);
        this.name = name;
        this.onSelect = onSelect;
        this.material = material.clone();
        this.material.color = new Color(color)
    }

    onCollisionEnd = (grip,controllerModel) => {
        controllerModel.children.forEach(child => child.material.color = new Color(this.material.color));
        this.onSelect(this.name);
    }

    update = () => {
        console.log('collided')
    }
}