import {
  pull,
  isNil,
  every
} from 'lodash';

import {
  Matrix4,
  Box3,
} from 'three';

import {
  buildController
} from './controller-model';

const INTERACTION_STATES = {
  HOVER: 0,
  SELECT: 1,
};

const HANDS_DISTANCE = 0.04;

export class Controller {
  constructor(
    renderer,
    index = 0,
    onControllerSelect = () => {},
    onControllerReady = () => {},
    isControllerModelNeeded = true
  ) {
    this.renderer = renderer;
    this.index = index;
    this.tempMatrix = new Matrix4();
    this.selectableObjects = [];
    this.selectedObject = null;
    this.interactionState = INTERACTION_STATES.HOVER;
    this.selectionBox = new Box3();
    this.onControllerSelect = onControllerSelect;
    this.onControllerReady = onControllerReady;
    this.isControllerModelNeeded = isControllerModelNeeded;
    this.isAlive = false;
    this.init();
  }

  init = () => {
    this.controller = this.renderer.xr.getController(this.index);

    this.controller.addEventListener('connected', this.onConnected);
    this.controller.addEventListener('disconnected', this.onDisconnected);
    this.controller.addEventListener('selectstart', this.onSelect);
    this.controller.addEventListener('selectend', this.onSelectEnd);
  };

  sync = () => {
    // runs on animation loop
    if (this.interactionState === INTERACTION_STATES.SELECT) {
      this.handleControllerSelection();
    } else {
      if (!isNil(this.selectedObj)) {
        this.selectedObject.onSelectEnd();
        this.selectedObject = null;
      }
    }
  }

  onConnected = (event) => {
    this.controller.grip = event.target;
    if (this.isControllerModelNeeded) {
      this.controllerModel = buildController(event.data);
      this.controller.add(this.controllerModel);
      this.leftPart = this.controllerModel.children.find(el => el.name === 'left-part');
      this.rightPart = this.controllerModel.children.find(el => el.name === 'right-part');
    };
    this.isAlive = true;
    this.onControllerReady(this.controller);
  }

  onDisconnected = () => {
    if (this.controllerModel) {
      this.controller.remove(this.controllerModel);
      this.leftPart = null;
      this.rightPart = null;
    }
    this.isAlive = false;
  }

  onSelect = () => {
    this.interactionState = INTERACTION_STATES.SELECT;

    const originalLeftPosition = this.leftPart.position.x;
    this.leftPart.position.setX(originalLeftPosition + HANDS_DISTANCE / 2)

    const originalRightPosition = this.rightPart.position.x;
    this.rightPart.position.setX(originalRightPosition - HANDS_DISTANCE / 2);

    this.onControllerSelect(this.controller);
  };

  onSelectEnd = () => {
    this.interactionState = INTERACTION_STATES.HOVER

    const originalLeftPosition = this.leftPart.position.x
    this.leftPart.position.setX(originalLeftPosition - HANDS_DISTANCE / 2)

    const originalRightPosition = this.rightPart.position.x;
    this.rightPart.position.setX(originalRightPosition + HANDS_DISTANCE / 2);

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

  handleControllerSelection = () => {
    every(this.selectableObjects, (obj) => {
      return this.checkIfControllerIsSelectingObject(obj);
    });
  }

  checkIfControllerIsSelectingObject = (obj) => {
    this.selectionBox.setFromObject(obj);
    this.boundingSphere = {
      radius: 0.01,
      center: this.controller.position
    };
    if (this.selectionBox.intersectsSphere(this.boundingSphere)) {
      if (this.selectedObject === obj) {
        this.selectedObject.update(this.controller);
      } else {
        if (!isNil(this.selectedObject)) {
          this.selectedObject.onSelectEnd(this.controller);
        }
        this.selectedObject = obj;
        obj.onSelect(this.controller);
      }
      return false;
    }
    return true;
  }

  destroy = () => {
    this.controllerModel.parent.remove(this.controllerModel);
  };
}