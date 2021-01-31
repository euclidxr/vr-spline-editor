
import {
    BoxBufferGeometry,
    Vector2,
    Vector3,
    Raycaster,
    BufferGeometry,
    Scene,
    Color,
    PerspectiveCamera,
    AmbientLight,
    SpotLight,
    PlaneBufferGeometry,
    ShadowMaterial,
    Mesh,
    GridHelper,
    WebGLRenderer,
    BufferAttribute,
    CatmullRomCurve3,
    Line,
    LineBasicMaterial,
    MeshLambertMaterial,
    Float32BufferAttribute,
    AdditiveBlending,
    RingBufferGeometry,
    MeshBasicMaterial
  } from 'three';

//   import Stats from 'three/examples/jsm/libs/stats.module.js';
  import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
  import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
  import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

  let container, stats;
  let controller1, controller2;
  let controllerGrip1, controllerGrip2;
  let camera, scene, renderer;
  const splineHelperObjects = [];
  let splinePointsLength = 4;
  const positions = [];
  const point = new Vector3();

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const onUpPosition = new Vector2();
  const onDownPosition = new Vector2();

  const geometry = new BoxBufferGeometry( 20, 20, 20 );
  let transformControl;

  const ARC_SEGMENTS = 200;

  const splines = {};

  const params = {
    uniform: true,
    tension: 0.5,
    centripetal: true,
    chordal: true,
    addPoint: addPoint,
    removePoint: removePoint,
    exportSpline: exportSpline
  };

  init();
  animate();

  function init() {

    container = document.getElementById( 'container' );

    scene = new Scene();
    scene.background = new Color( 0xf0f0f0 );

    camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 0, 50, 1000 );
    scene.add( camera );

    scene.add( new AmbientLight( 0xf0f0f0 ) );
    const light = new SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1500, 200 );
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    light.shadow.bias = - 0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add( light );

    const planeGeometry = new PlaneBufferGeometry( 2000, 2000 );
    planeGeometry.rotateX( - Math.PI / 2 );
    const planeMaterial = new ShadowMaterial( { opacity: 0.2 } );

    const plane = new Mesh( planeGeometry, planeMaterial );
    plane.position.y = - 200;
    plane.receiveShadow = true;
    scene.add( plane );

    const helper = new GridHelper( 2000, 100 );
    helper.position.y = - 199;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add( helper );

    renderer = new WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    container.appendChild( renderer.domElement );

    document.body.appendChild( VRButton.createButton( renderer ) );

    // stats = new Stats();
    // container.appendChild( stats.dom );

    // const gui = new GUI();

    // gui.add( params, 'uniform' );
    // gui.add( params, 'tension', 0, 1 ).step( 0.01 ).onChange( function ( value ) {

    //   splines.uniform.tension = value;
    //   updateSplineOutline();

    // } );
    // gui.add( params, 'centripetal' );
    // gui.add( params, 'chordal' );
    // gui.add( params, 'addPoint' );
    // gui.add( params, 'removePoint' );
    // gui.add( params, 'exportSpline' );
    // gui.open();

    // Controls
    // const controls = new OrbitControls( camera, renderer.domElement );
    // controls.damping = 0.2;
    // controls.addEventListener( 'change', render );

    // transformControl = new TransformControls( camera, renderer.domElement );
    // transformControl.addEventListener( 'change', render );
    // transformControl.addEventListener( 'dragging-changed', function ( event ) {

    //   controls.enabled = ! event.value;

    // } );
    // scene.add( transformControl );

    // transformControl.addEventListener( 'objectChange', function () {

    //   updateSplineOutline();

    // } );

    // document.addEventListener( 'pointerdown', onPointerDown, false );
    // document.addEventListener( 'pointerup', onPointerUp, false );
    // document.addEventListener( 'pointermove', onPointerMove, false );

    /*******
     * Curves
     *********/

    for ( let i = 0; i < splinePointsLength; i ++ ) {

      addSplineObject( positions[ i ] );

    }

    positions.length = 0;

    for ( let i = 0; i < splinePointsLength; i ++ ) {

      positions.push( splineHelperObjects[ i ].position );

    }

    const geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new BufferAttribute( new Float32Array( ARC_SEGMENTS * 3 ), 3 ) );

    let curve = new CatmullRomCurve3( positions );
    curve.curveType = 'catmullrom';
    curve.mesh = new Line( geometry.clone(), new LineBasicMaterial( {
      color: 0xff0000,
      opacity: 0.35
    } ) );
    curve.mesh.castShadow = true;
    splines.uniform = curve;

    curve = new CatmullRomCurve3( positions );
    curve.curveType = 'centripetal';
    curve.mesh = new Line( geometry.clone(), new LineBasicMaterial( {
      color: 0x00ff00,
      opacity: 0.35
    } ) );
    curve.mesh.castShadow = true;
    splines.centripetal = curve;

    curve = new CatmullRomCurve3( positions );
    curve.curveType = 'chordal';
    curve.mesh = new Line( geometry.clone(), new LineBasicMaterial( {
      color: 0x0000ff,
      opacity: 0.35
    } ) );
    curve.mesh.castShadow = true;
    splines.chordal = curve;

    for ( const k in splines ) {

      const spline = splines[ k ];
      scene.add( spline.mesh );

    }

    load( [ new Vector3( 289.76843686945404, 452.51481137238443, 56.10018915737797 ),
      new Vector3( - 53.56300074753207, 171.49711742836848, - 14.495472686253045 ),
      new Vector3( - 91.40118730204415, 176.4306956436485, - 6.958271935582161 ),
      new Vector3( - 383.785318791128, 491.1365363371675, 47.869296953772746 ) ] );

    // controllers

    function onSelectStart() {

      this.userData.isSelecting = true;

    }

    function onSelectEnd() {

      this.userData.isSelecting = false;

    }

    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );
    controller1.addEventListener( 'connected', function ( event ) {

      this.add( buildController( event.data ) );

    } );
    controller1.addEventListener( 'disconnected', function () {

      this.remove( this.children[ 0 ] );

    } );
    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );
    controller2.addEventListener( 'connected', function ( event ) {

      this.add( buildController( event.data ) );

    } );
    controller2.addEventListener( 'disconnected', function () {

      this.remove( this.children[ 0 ] );

    } );
    scene.add( controller2 );

    // The XRControllerModelFactory will automatically fetch controller models
    // that match what the user is holding as closely as possible. The models
    // should be attached to the object returned from getControllerGrip in
    // order to match the orientation of the held device.

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );

    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );

    //

    window.addEventListener( 'resize', onWindowResize, false );

  }

  function addSplineObject( position ) {

    const material = new MeshLambertMaterial( { color: Math.random() * 0xffffff } );
    const object = new Mesh( geometry, material );

    if ( position ) {

      object.position.copy( position );

    } else {

      object.position.x = Math.random() * 1000 - 500;
      object.position.y = Math.random() * 600;
      object.position.z = Math.random() * 800 - 400;

    }

    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );
    splineHelperObjects.push( object );
    return object;

  }

  function addPoint() {

    splinePointsLength ++;

    positions.push( addSplineObject().position );

    updateSplineOutline();

  }

  function removePoint() {

    if ( splinePointsLength <= 4 ) {

      return;

    }

    const point = splineHelperObjects.pop();
    splinePointsLength --;
    positions.pop();

    // if ( transformControl.object === point ) transformControl.detach();
    scene.remove( point );

    updateSplineOutline();

  }

  function updateSplineOutline() {

    for ( const k in splines ) {

      const spline = splines[ k ];

      const splineMesh = spline.mesh;
      const position = splineMesh.geometry.attributes.position;

      for ( let i = 0; i < ARC_SEGMENTS; i ++ ) {

        const t = i / ( ARC_SEGMENTS - 1 );
        spline.getPoint( t, point );
        position.setXYZ( i, point.x, point.y, point.z );

      }

      position.needsUpdate = true;

    }

  }

  function exportSpline() {

    const strplace = [];

    for ( let i = 0; i < splinePointsLength; i ++ ) {

      const p = splineHelperObjects[ i ].position;
      strplace.push( `new Vector3(${p.x}, ${p.y}, ${p.z})` );

    }

    console.log( strplace.join( ',\n' ) );
    const code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
    prompt( 'copy and paste code', code );

  }

  function load( new_positions ) {

    while ( new_positions.length > positions.length ) {

      addPoint();

    }

    while ( new_positions.length < positions.length ) {

      removePoint();

    }

    for ( let i = 0; i < positions.length; i ++ ) {

      positions[ i ].copy( new_positions[ i ] );

    }

    updateSplineOutline();

  }

  function animate() {

    renderer.setAnimationLoop( render );

  }

  function render() {

    // handleController( controller1 );
    // handleController( controller2 );

    splines.uniform.mesh.visible = params.uniform;
    splines.centripetal.mesh.visible = params.centripetal;
    splines.chordal.mesh.visible = params.chordal;
    renderer.render( scene, camera );

    // stats.update();

  }

  function onPointerDown( event ) {

    onDownPosition.x = event.clientX;
    onDownPosition.y = event.clientY;

  }

  function onPointerUp() {

    onUpPosition.x = event.clientX;
    onUpPosition.y = event.clientY;

    // if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) transformControl.detach();

  }

  function onPointerMove( event ) {

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( splineHelperObjects );

    if ( intersects.length > 0 ) {

      const object = intersects[ 0 ].object;

      // if ( object !== transformControl.object ) {

      //   transformControl.attach( object );

      // }

    }

  }

  function buildController( data ) {

    let geometry, material;

    switch ( data.targetRayMode ) {

      case 'tracked-pointer':

        geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
        geometry.setAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

        material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );

        return new Line( geometry, material );

      case 'gaze':

        geometry = new RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
        material = new MeshBasicMaterial( { opacity: 0.5, transparent: true } );
        return new Mesh( geometry, material );

    }

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function handleController( controller ) {

    if ( controller.userData.isSelecting ) {

      const object = room.children[0];

      object.position.copy( controller.position );
      object.userData.velocity.x = ( Math.random() - 0.5 ) * 3;
      object.userData.velocity.y = ( Math.random() - 0.5 ) * 3;
      object.userData.velocity.z = ( Math.random() - 9 );
      object.userData.velocity.applyQuaternion( controller.quaternion );

    }

  }