import {
    BoxBufferGeometry,
    MeshLambertMaterial,
    RingBufferGeometry,
    MeshBasicMaterial,
    Mesh,
    Object3D,
} from 'three';

export function buildController(data) {
    let geometry, material;

    switch (data.targetRayMode) {
        case 'tracked-pointer':
            geometry = new BoxBufferGeometry(0.01, 0.02, 0.03);
            material = new MeshLambertMaterial({
                color: 0x101010
            });

            const leftObj = new Mesh(geometry, material)
            leftObj.name = 'left-part'

            const rightObj = leftObj.clone();
            rightObj.name = 'right-part'

            rightObj.position.x = leftObj.position.x + 0.02;
            leftObj.position.x = leftObj.position.x - 0.02;

            const groupMesh = new Object3D();
            groupMesh.add(leftObj).add(rightObj);

            return groupMesh;

        case 'gaze':
            geometry = new RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1);
            material = new MeshBasicMaterial({
                opacity: 0.5,
                transparent: true,
            });
            return new Mesh(geometry, material);
    }
}