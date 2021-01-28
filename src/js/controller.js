import {BufferGeometry,Float32BufferAttribute,LineBasicMaterial,RingBufferGeometry,MeshBasicMaterial,Mesh,AdditiveBlending,Line, BoxBufferGeometry, MeshLambertMaterial} from 'three';
import {GamepadControls} from '@euclidxr/components';
import { generateRandomColor } from './utils';

export function getController(renderer,index,onSelectStart = () => {},onSelectEnd =() => {}) {
    const controller = renderer.xr.getController(index);
    controller.addEventListener('connected',function(event){
        this.add(buildController(event.data));
        controller.gp = new GamepadControls(event,controller);
        console.log(onSelectStart,'kk');
        controller.gp.trigger.addEventListener('down',onSelectStart);
        controller.gp.squeeze.addEventListener('down',onSelectStart);
    });

    controller.addEventListener('disconnected',function() {
        this.remove(this.children[0]);
    });

    // controller.addEventListener('selectstart',onSelectStart);

    // controller.addEventListener('selectend',onSelectEnd);

    return controller;

}

function buildController(data){
    let geometry, material;

    switch ( data.targetRayMode ) {

        case 'tracked-pointer':

            geometry = new BoxBufferGeometry(0.1,0.2,0.3);
            material = new MeshLambertMaterial({
                color: generateRandomColor()
            });

            return new Mesh(geometry,material);

            // geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) ); //wutt
            // geometry.setAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 5, 0, 0, 0 ], 3 ) );

            // material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending,color:0xffffff } );

            // return new Line( geometry, material );



        case 'gaze':

            geometry = new RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
            material = new MeshBasicMaterial( { opacity: 0.5, transparent: true } );
            return new Mesh( geometry, material );

    }

}
