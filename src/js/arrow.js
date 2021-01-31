
import { Color, ConeBufferGeometry, CylinderBufferGeometry, Mesh, MeshLambertMaterial } from "three";
import { generateRandomColor } from "./utils";

const material = new MeshLambertMaterial({
});

const coneGeom = new ConeBufferGeometry(0.02,0.03,32);
const cylinderGeom = new CylinderBufferGeometry(.02,.06,.08,10);

const cone = new Mesh(coneGeom,material);

export class Arrow extends Mesh{
    constructor(color = generateRandomColor()){
        super(cylinderGeom,material);
        cylinderGeom.merge(cone.geometry,cone.matrix);
        this.scale.set(0.1,0.1,0.1);
        this.material = material.clone();
        this.material.color = new Color(color);
    }
}