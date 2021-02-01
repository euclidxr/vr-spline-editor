import { Color, Mesh, MeshPhongMaterial, SphereBufferGeometry } from "three"



const material = new MeshPhongMaterial({
    color: 0xff0000,
    emissive:true
});

const geometry = new SphereBufferGeometry(0.03,32,32)

export class OptionMesh extends Mesh {
    constructor(name,color,onSelect = () => {}){
        super(geometry,material);
        this.name = name;
        this.onSelect = onSelect;
        this.material = material.clone();
        this.material.color = new Color(color);
        this.material.transparent = true;
    }

    onSelect = () => {
        this.material.opacity = 0.2;
        this.scale.set(0.8,0.8,0.8);
    }

    onSelectEnd = (controller) => {
        controller.children[0].children.forEach(child => child.material.color = new Color(this.material.color));
        this.material.opacity = 1;
        this.scale.set(1,1,1);
        this.onSelect(this.name);

    }

    update = () => {
    }
}