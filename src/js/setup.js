// FIXME: Shadow is not yet cast

import {
    isNil,
    map,
    pull,
    random
} from "lodash";
import {
    AmbientLight,
    BoxBufferGeometry,
    BufferGeometry,
    CatmullRomCurve3,
    Color,
    GridHelper,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshLambertMaterial,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    ShadowMaterial,
    SpotLight,
    sRGBEncoding,
    Vector3,
    WebGLRenderer
} from "three";
import {
    VRButton
} from "three/examples/jsm/webxr/VRButton";
import {
    Arrow
} from './arrow';
import {
    OptionMesh
} from './options';
import {
    Controller
} from "./raycaster";
import {
    SplineObject
} from "./spline-object";

export let SETUP_GLOBALS = {};

const DEFAULT_SPLINE_POINTS = 5;
const CURVE_LINE_WIDTH = 0.5;
const splinePositions = [];
const splineObjects = [];
const splines = {};
const point = new Vector3();
const arrows = {};
const axis = new Vector3();
const up = new Vector3(0, 1, 0)

export const OPTIONS = {
    REMOVE: 'REMOVE',
    ADD: 'ADD',
    MOVE: 'MOVE'
}
export const OPTIONS_COLORS = {
    REMOVE: 0xff0000,
    ADD: 0x00ff00,
    MOVE: 0x0000ff
}

export const CONTROLLER_STATE = {
    REMOVE: 'REMOVE',
    MOVE: 'MOVE',
    ADD: 'ADD'
}

function init() {
    const scene = new Scene;
    scene.background = new Color(0xf0f0f0);
    SETUP_GLOBALS.scene = scene;

    const {
        width,
        height,
        aspect
    } = getWindowSize(window);

    const canvas = document.getElementById('canvas-container');

    const camera = new PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 1.6, 3);
    SETUP_GLOBALS.camera = camera;

    const ambientLight = new AmbientLight(0xf0f0f0);
    const spotLight = new SpotLight(0xffffff, 1.5);
    spotLight.position.set(0, 10, 20);
    spotLight.angle = Math.PI / 2;
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 30;
    spotLight.shadow.camera.far = 100;
    spotLight.shadow.bias = -0.000222;
    spotLight.shadow.mapSize.set(1024, 1024);

    scene.add(ambientLight);
    scene.add(spotLight);
    arrows['uniform'] = new Arrow(0xff0000);
    arrows['centripetal'] = new Arrow(0x00ff00);
    arrows['chordal'] = new Arrow(0x0000ff);
    for (const k in arrows) {
        scene.add(arrows[k])
    }
    const planeGeometry = new PlaneBufferGeometry(2000, 2000);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new ShadowMaterial({
        opacity: 0.2
    });

    const plane = new Mesh(planeGeometry, planeMaterial);
    plane.position.set(0, 0, 0);
    plane.receiveShadow = true;
    scene.add(plane);

    const gridHelper = new GridHelper(200, 100);
    gridHelper.position.set(0, -0.01, 0);
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);


   

    const renderer = initRenderer(canvas, {
        width,
        height
    });
    const controllerOne = new Controller(renderer, 0,onControllerSelect);
    const controllerTwo = new Controller(renderer,1,()=>{},onControllerReady);
    SETUP_GLOBALS.ctrl1 = controllerOne;
    SETUP_GLOBALS.ctrl2 = controllerTwo;
    scene.add(controllerOne.controller)
    scene.add(controllerTwo.controller)

    // controllerOne.addCollidableObject(option);
   
    SETUP_GLOBALS.controllerState = CONTROLLER_STATE.MOVE;
    for (let i = 0; i < DEFAULT_SPLINE_POINTS; i++) {
        const splineObj = new SplineObject({
            onUpdate: updateSplineOutline,
            collisionEnd: collisionEnd
        });
        scene.add(splineObj);
        // controllerOne.addSelectableObject(splineObj);
        controllerOne.addCollidableObject(splineObj);
        splinePositions[i] = splineObj.position;
    }

    buildSplineCurve(splinePositions);
    for (const k in splines) {
        const spline = splines[k];
        scene.add(spline.mesh)
    }
    renderer.setAnimationLoop(update);
    SETUP_GLOBALS.renderer = renderer;
    document.body.appendChild(VRButton.createButton(renderer));
}
let t = 0;

function update() {
    const {
        camera,
        scene,
        renderer,
        ctrl1,
    } = SETUP_GLOBALS;

    if (ctrl1.updateRaycaster) {
        ctrl1.sync();
    }

    for (const k in splines) {
        const spline = splines[k];
        const arrow = arrows[k]
        let pt = spline.getPoint(t);
        arrow.position.set(pt.x, pt.y, pt.z);

        // get the tangent to the curve
        let tangent = spline.getTangent(t).normalize();

        // calculate the axis to rotate around
        axis.crossVectors(up, tangent).normalize();

        // calcluate the angle between the up vector and the tangent
        let radians = Math.acos(up.dot(tangent));

        // set the quaternion
        arrow.quaternion.setFromAxisAngle(axis, radians);

        t = (t >= 1) ? 0 : t += 0.0001;
    }


    splines.uniform.mesh.visible = true;
    splines.centripetal.mesh.visible = true;
    splines.chordal.mesh.visible = true;
    renderer.render(scene, camera);
}



function getWindowSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const aspect = width / height;
    return {
        width,
        height,
        aspect
    };
}


function initRenderer(canvasEl, {
    width,
    height
}) {
    const renderer = new WebGLRenderer({
        antialias: true,
        canvas: canvasEl
    });
    renderer.xr.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = sRGBEncoding;
    renderer.shadowMap.enabled = true;
    return renderer;
}


function buildSplineCurve(positions) {

    let curve = new CatmullRomCurve3(positions);
    let points = curve.getPoints(150);
    let geometry = new BufferGeometry().setFromPoints(points);

    curve.curveType = 'catmullrom';
    curve.mesh = new Line(geometry.clone(), new LineBasicMaterial({
        color: 0xff0000,
        opacity: 0.15,
        linewidth: CURVE_LINE_WIDTH
    }));
    curve.mesh.position.subScalar(0.005)
    curve.mesh.castShadow = true;
    splines.uniform = curve;
    splines.uniform.tension = 0.5;


    const centripetalCurve = new CatmullRomCurve3(positions);
    centripetalCurve.curveType = 'centripetal';
    centripetalCurve.mesh = new Line(geometry.clone(), new LineBasicMaterial({
        color: 0x00ff00,
        opacity: 0.15,
        linewidth: CURVE_LINE_WIDTH
    }));
    centripetalCurve.mesh.castShadow = true;
    centripetalCurve.tension = 0.1;
    splines.centripetal = centripetalCurve;

    const chordalCurve = new CatmullRomCurve3(positions);
    chordalCurve.curveType = 'chordal';
    chordalCurve.mesh = new Line(geometry.clone(), new LineBasicMaterial({
        color: 0x0000ff,
        opacity: 0.15,
        linewidth: CURVE_LINE_WIDTH
    }));
    chordalCurve.mesh.position.addScalar(0.005)
    chordalCurve.mesh.castShadow = true;
    splines.chordal = chordalCurve;
}

function onControllerSelect(controller) {
    if (SETUP_GLOBALS.controllerState === CONTROLLER_STATE.ADD) {
        const splineObj = new SplineObject({
            onUpdate: updateSplineOutline,
            collisionEnd: collisionEnd,
            position: controller.position.clone()
        });
        SETUP_GLOBALS.ctrl1.addCollidableObject(splineObj);
        SETUP_GLOBALS.scene.add(splineObj);
        splinePositions.push(splineObj.position);
        splineObjects.push(splineObj);
        updateSplineOutline();

    }

}

function updateSplineOutline() {
    for (const k in splines) {

        const spline = splines[k];

        const splineMesh = spline.mesh;
        const position = splineMesh.geometry.attributes.position;

        for (let i = 0; i < 151; i++) {

            const t = i / (150);
            spline.getPoint(t, point);
            position.setXYZ(i, point.x, point.y, point.z);

        }

        position.needsUpdate = true;

    }

}

function collisionEnd(splineObj,grip) {
    if (SETUP_GLOBALS.controllerState === CONTROLLER_STATE.REMOVE) {
        SETUP_GLOBALS.ctrl1.removeCollidableObject(splineObj)
        // splineObj.destroy();
        pull(splineObjects, splineObj);
        pull(splinePositions, splineObj.position);
        SETUP_GLOBALS.scene.remove(splineObj);
        updateSplineOutline();
    }
}


function onOptionSelect(option) {
    if (option === OPTIONS.REMOVE) {
        SETUP_GLOBALS.controllerState = CONTROLLER_STATE.REMOVE;
    }
    if (option === OPTIONS.ADD) {
        SETUP_GLOBALS.controllerState = CONTROLLER_STATE.ADD
    }
    if (option === OPTIONS.MOVE) {
        SETUP_GLOBALS.controllerState = CONTROLLER_STATE.MOVE;
    }
}

function onControllerReady(controller) {
    let yPosition = 0.1;

    map(OPTIONS,(value,key) => {
        const option = new OptionMesh(value,OPTIONS_COLORS[key], onOptionSelect);
        option.position.set(0,yPosition,0);
        yPosition += 0.05;
        SETUP_GLOBALS.ctrl1.addCollidableObject(option);
        controller.add(option)
    })
}

// function calls

window.addEventListener('load', init);