import {
  pull,
  isEmpty,
  isNil,
  every
} from 'lodash';
import {
  BufferGeometry as RingBufferGeometry,
  MeshBasicMaterial,
  Mesh,
  Raycaster,
  Matrix4,
  BoxBufferGeometry,
  MeshLambertMaterial,
  Box3,
  Object3D,
} from 'three';

const INTERACTION_STATES = {
  HOVER: 0,
  SELECT: 1,
  COLLISION: 2
};

// FIXME: Change the name of file
export class Controller {
  constructor(renderer, id = 0, onControllerSelect,onControllerReady=() =>{}) {
    this.renderer = renderer;
    this.id = id;
    this.raycaster = new Raycaster();
    this.tempMatrix = new Matrix4();
    this.init();
    this.selectableObjects = [];
    this.collidableObjects = [];
    this.hoverableObjects = [];
    this.hoveredObject = null;
    this.selectedObject = null;
    this.collidedObject = null;
    this.interactionState = INTERACTION_STATES.HOVER;
    this.collisionBox = new Box3();
    this.onControllerSelect = onControllerSelect;
    this.onControllerReady = onControllerReady;
  }

  init = () => {
    this.controller = this.renderer.xr.getController(this.id);
    this.controller.addEventListener('connected', (event) => {
      this.controller.grip = event.target;
      this.controllerModel = buildController(event.data);
      this.controller.add(this.controllerModel);
      this.onControllerReady(this.controller);
    });
    this.controller.addEventListener('disconnected', (event) => {
      if (this.controllerModel) {
        this.controller.remove(this.controllerModel);
      }
    });

    // this.syncIntervalId = setInterval(() => {
    //   this.sync();
    // }, 100);

    this.controller.addEventListener('selectstart', this.onSelect);
    this.controller.addEventListener('selectend', this.onSelectEnd);
  };

  addHoverableObject = (obj) => {
    this.hoverableObjects.push(obj);
  };

  removeHoverableObject = (obj) => {
    pull(this.hoverableObjects, obj);
  };

  addCollidableObject = (obj) => {
    this.collidableObjects.push(obj)
  }

  removeCollidableObject = (obj) => {
    pull(this.collidableObjects, obj);
  }

  updateRaycaster = () => {
    this.tempMatrix.identity().extractRotation(this.controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(
      this.controller.matrixWorld
    );
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
  };

  sync = () => {

    this.handleControllerCollision();
    if (this.interactionState === INTERACTION_STATES.SELECT && !isNil(this.selectedObject)) {
      this.selectedObject.update(this.controller);
    }
    if (
      isEmpty(this.hoverableObjects)
    ) {
      return false;
    }
    const hoveredTargets = this.raycaster.intersectObjects(
      this.hoverableObjects,
      false
    );
    this.updateRaycaster();
    if (hoveredTargets.length > 0) {
      // eslint-disable-next-line
      if (hoveredTargets[0].object != this.hoveredObject) {
        if (this.hoveredObject) {
          this.hoveredObject.onHoverEnd(this.hoveredObject);
        }
        this.hoveredObject = hoveredTargets[0].object;
        this.hoveredObject.onHover(this.hoveredObject);
      }
    }
    return true;
  };

  onSelect = () => {
    this.interactionState = INTERACTION_STATES.SELECT;
    this.leftPart = this.controllerModel.children.filter(child => {
      return child.name === 'left-part'
    })[0];
    this.righPart = this.controllerModel.children.filter(child => child.name === 'right-part')[0];
    const originalPosition = this.leftPart.position.x
    this.leftPart.position.setX(originalPosition + 0.02)

    const originalRightPosition = this.righPart.position.x;
    this.righPart.position.setX(originalRightPosition - 0.02);

    this.onControllerSelect(this.controller)
    // this.leftPart.position.x += 0.05;
    // this.righPart.position.x -= 0.05;

    // this.updateRaycaster();
    // const targets = [...this.selectableObjects];
    // const intersects = this.raycaster.intersectObjects(targets, false);
    // if (intersects.length > 0 && intersects[0].object.onSelect) {
    //   this.selectedObject = intersects[0].object;

    //   intersects[0].object.onSelect(this.controller);
    // }
  };

  onSelectEnd = () => {
    this.interactionState = INTERACTION_STATES.HOVER

    const originalPosition = this.leftPart.position.x
    this.leftPart.position.setX(originalPosition - 0.02)

    const originalRightPosition = this.righPart.position.x;
    this.righPart.position.setX(originalRightPosition + 0.02);

    this.updateRaycaster();
    if (isNil(this.selectedObject)) {
      return false;
    }
    this.selectedObject.onSelectEnd(this.controller);
    this.selectedObject = null;
  }

  addSelectableObject = (object) => {
    this.selectableObjects.push(object);
  };

  removeSelectableObject = (object) => {
    pull(this.selectableObjects, object);
  };

  handleControllerCollision = () => {
    const {
      grip
    } = this.controller;
    if (isNil(grip)) {
      return;
    }
    const boundingSphere = {
      radius: 0.01,
      center: grip.position
    };

    if (this.interactionState === INTERACTION_STATES.SELECT) {

      every(this.collidableObjects, (obj) => {
        this.collisionBox.setFromObject(obj);
        if (this.collisionBox.intersectsSphere(boundingSphere)) {
          if (this.collidedObject !== obj && !isNil(this.collidedObject)) {
            this.collidedObject.onCollisionEnd(grip, this.controllerModel);
          }
          this.collidedObject = obj;
          obj.update(grip);
          return false;
        }
        return true;
      });
    } else {
      if (!isNil(this.collidedObject)) {
        this.collidedObject.onCollisionEnd(grip, this.controllerModel);
        this.collidedObject = null;
      }
    }
  }

  destroy = () => {
    this.controllerModel.parent.remove(this.controllerModel);
    // clearInterval(this.syncIntervalId);
  };
}

function buildController(data) {
  let geometry, material;

  switch (data.targetRayMode) {
    case 'tracked-pointer':
      geometry = new BoxBufferGeometry(0.01, 0.02, 0.03);
      material = new MeshLambertMaterial({
        color: 0x101010
      });

      const obj = new Mesh(geometry, material)
      obj.name = 'left-part'
      const newObj = obj.clone();
      newObj.position.x = obj.position.x + 0.02;
      obj.position.x = obj.position.x - 0.02;
      newObj.name = 'right-part'

      const obj3d = new Object3D();

      obj3d.add(obj);
      obj3d.add(newObj);

      return obj3d;

    case 'gaze':
      geometry = new RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1);
      material = new MeshBasicMaterial({
        opacity: 0.5,
        transparent: true,
      });
      return new Mesh(geometry, material);
  }
}