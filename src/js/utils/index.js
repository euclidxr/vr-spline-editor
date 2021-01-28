import {random} from 'lodash';
import { Color } from 'three';
export function generateRandomColor() {
    const randomColor = `hsl(${random(0,360)},${random(25,100)}%, 35%)`
    return new Color(randomColor);
}