// FIXME: Shadow is not yet cast

import {
    isNil,
    map,
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
    WebGLRenderer
} from "three";
import {
    VRButton
} from "three/examples/jsm/webxr/VRButton";

export let SETUP_GLOBALS = {};

const DEFAULT_SPLINE_POINTS = 4;
const CURVE_LINE_WIDTH = 0.5;
const splinePositions = [];
const splines ={};

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
    spotLight.castShadow =true;
    spotLight.shadow.camera.near = 30;
    spotLight.shadow.camera.far = 80;
    spotLight.shadow.bias = -0.000222;
    spotLight.shadow.mapSize.set(1024,1024);

    scene.add(ambientLight);
    scene.add(spotLight);

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
    scene.add(gridHelper)

    for(let i=0;i<DEFAULT_SPLINE_POINTS;i++){
        const splineObj = addSplineObject();
        scene.add(splineObj);
        splinePositions[i] = splineObj.position;
    }

    buildSplineCurve(splinePositions);
    for(const k in splines){
        const spline = splines[k];
        scene.add(spline.mesh)
    }

    const renderer = initRenderer(canvas, {
        width,
        height
    });
    renderer.setAnimationLoop(update);
    SETUP_GLOBALS.renderer = renderer;
    document.body.appendChild(VRButton.createButton(renderer));
}

function update() {
    const {
        camera,
        scene,
        renderer
    } = SETUP_GLOBALS;
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

function generateRandomColor() {
    const randomColor = `hsl(${random(0,360)},${random(25,100)}%, 35%)`
    return randomColor;
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

function addSplineObject(position) {
    const material = new MeshLambertMaterial({
        color: generateRandomColor(),
        opacity: 0.8,
    });
    const geometry = new BoxBufferGeometry(0.1, 0.1, 0.1);
    const obj = new Mesh(geometry, material);
    obj.castShadow = true;
    obj.receiveShadow = true;
    if(isNil(position))
    {
        obj.position.set(random(-3.5, 3.5), random(0.5, 3.5), random(-3.4, -0.8));
    }
    else{
        obj.position.copy(position)
    }
    return obj;
}

function buildSplineCurve(positions) {
    console.log(positions);
    
    let curve = new CatmullRomCurve3( positions );
    let points = curve.getPoints( 150 );
    let geometry = new BufferGeometry().setFromPoints( points );
    
    curve.curveType = 'catmullrom';
    curve.mesh = new Line( geometry.clone(), new LineBasicMaterial( {
      color: 0xff0000,
      opacity: 0.15,
      linewidth: CURVE_LINE_WIDTH
    } ) );
    curve.mesh.position.subScalar(0.005)
    curve.mesh.castShadow = true;
    splines.uniform = curve;
    splines.uniform.tension = 0.5;


    const centripetalCurve = new CatmullRomCurve3(positions);
    centripetalCurve.curveType = 'centripetal';
    centripetalCurve.mesh = new Line( geometry.clone(), new LineBasicMaterial( {
      color: 0x00ff00,
      opacity: 0.15,
      linewidth: CURVE_LINE_WIDTH
    } ) );
    centripetalCurve.mesh.castShadow = true;
    centripetalCurve.tension = 0.1;
    splines.centripetal = centripetalCurve;

    const chordalCurve = new CatmullRomCurve3( positions );
    chordalCurve.curveType = 'chordal';
    chordalCurve.mesh = new Line( geometry.clone(), new LineBasicMaterial( {
      color: 0x0000ff,
      opacity: 0.15,
      linewidth: CURVE_LINE_WIDTH
    } ) );
    chordalCurve.mesh.position.addScalar(0.005)
    chordalCurve.mesh.castShadow = true;
    splines.chordal = chordalCurve;
}

// function calls

window.addEventListener('load', init);