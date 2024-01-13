import { Ray, ShapeAlignment } from "./core";
import { GeomHelpers } from "./helpers";
import {
  AbstractShape, Arc
} from "./shapes";

export enum TangramType {
  TOP_LEFT = 1,
  TOP_RIGHT = 2,
  BOTTOM_LEFT = 3,
  BOTTOM_RIGHT = 4,
  LEFT = 5,
  RIGHT = 6,
  TOP = 7,
  BOTTOM = 8,
  CENTER = 9,
}

export class Tangram extends AbstractShape {
  type: TangramType;
  width: number;
  height: number;
  constructor(center?: Ray, width: number = 100, height: number = 100, type: TangramType = TangramType.TOP_LEFT, divisions: number = 1, alignment: ShapeAlignment = ShapeAlignment.CENTER, reverse: boolean = false) {
    super(center, divisions, alignment, reverse);
    this.width = width;
    this.height = height;
    this.type = type;
  }
  generate(): Ray[] {
    const topLeftCorner = new Ray(this.center.x - this.width / 2, this.center.y - this.height / 2);
    const topRightCorner = new Ray(this.center.x + this.width / 2, this.center.y - this.height / 2);
    const bottomRightCorner = new Ray(this.center.x + this.width / 2, this.center.y + this.height / 2);
    const bottomLeftCorner = new Ray(this.center.x - this.width / 2, this.center.y + this.height / 2);
    const centerCorner = this.center.clone();
    const leftCorner = new Ray(this.center.x - this.width / 2, this.center.y);
    const rightCorner = new Ray(this.center.x + this.width / 2, this.center.y);
    const topCorner = new Ray(this.center.x, this.center.y - this.height / 2);
    const bottomCorner = new Ray(this.center.x, this.center.y + this.height / 2);
    let corners: Ray[];
    switch (this.type) {
      case TangramType.LEFT:
        corners = [topLeftCorner, centerCorner, bottomLeftCorner];
        break;
      case TangramType.RIGHT:
        corners = [topRightCorner, bottomRightCorner, centerCorner];
        break;
      case TangramType.TOP:
        corners = [topLeftCorner, topRightCorner, centerCorner];
        break;
      case TangramType.BOTTOM:
        corners = [bottomLeftCorner, centerCorner, bottomRightCorner];
        break;
      case TangramType.CENTER:
        corners = [leftCorner, topCorner, rightCorner, bottomCorner];
        break;
      case TangramType.TOP_LEFT:
        corners = [topLeftCorner, topRightCorner, bottomLeftCorner];
        break;
      case TangramType.TOP_RIGHT:
        corners = [topRightCorner, bottomRightCorner, bottomLeftCorner];
        break;
      case TangramType.BOTTOM_LEFT:
        corners = [bottomLeftCorner, topLeftCorner, bottomRightCorner];
        break;
      case TangramType.BOTTOM_RIGHT:
        corners = [bottomRightCorner, topRightCorner, topLeftCorner];
        break;
      default:
        corners = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner];
    }
    if (this.reverse) {
      corners = corners.reverse();
    }
    if (this.center.direction) {
      corners.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    return corners;
  }
  clone() {
    const s = new Tangram(this.center, this.width, this.height, this.type, this.divisions, this.alignment, this.reverse);
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}

export class RoundedTangram extends Tangram {
  generate(): Ray[] {
    const topLeftCorner = new Ray(this.center.x - this.width / 2, this.center.y - this.height / 2);
    const topRightCorner = new Ray(this.center.x + this.width / 2, this.center.y - this.height / 2);
    const bottomRightCorner = new Ray(this.center.x + this.width / 2, this.center.y + this.height / 2);
    const bottomLeftCorner = new Ray(this.center.x - this.width / 2, this.center.y + this.height / 2);
    const centerCorner = this.center.clone();
    const leftCorner = new Ray(this.center.x - this.width / 2, this.center.y);
    const rightCorner = new Ray(this.center.x + this.width / 2, this.center.y);
    const topCorner = new Ray(this.center.x, this.center.y - this.height / 2);
    const bottomCorner = new Ray(this.center.x, this.center.y + this.height / 2);
    const middleLeftCorner = new Ray(this.center.x - this.width / 2, this.center.y);
    const middleRightCorner = new Ray(this.center.x + this.width / 2, this.center.y);
    const middleTopCorner = new Ray(this.center.x, this.center.y - this.height / 2);
    const middleBottomCorner = new Ray(this.center.x, this.center.y + this.height / 2);
    let rays: Ray[];
    switch (this.type) {
      case TangramType.LEFT:
        rays = new Arc(middleLeftCorner, this.height / 2, 0 - Math.PI / 2, Math.PI / 2, this.divisions, this.alignment).generate();
        break;
      case TangramType.RIGHT:
        rays = new Arc(middleRightCorner, this.height / 2, Math.PI / 2, Math.PI * 1.5, this.divisions, this.alignment).generate();
        break;
      case TangramType.TOP:
        rays = new Arc(middleTopCorner, this.width / 2, 0, Math.PI, this.divisions, this.alignment).generate();
        break;
      case TangramType.BOTTOM:
        rays = new Arc(middleBottomCorner, this.width / 2, Math.PI, Math.PI * 2, this.divisions, this.alignment).generate();
        break;
      case TangramType.CENTER:
        rays = new Arc(centerCorner, this.width / 2, 0, Math.PI * 2, this.divisions * 2, this.alignment).generate();
        break;
      case TangramType.TOP_LEFT:
        rays = [topLeftCorner, ...new Arc(topLeftCorner, this.height, 0, Math.PI / 2, this.divisions, this.alignment).generate()];
        break;
      case TangramType.TOP_RIGHT:
        rays = [topRightCorner, ...new Arc(topRightCorner, this.height, Math.PI / 2, Math.PI, this.divisions, this.alignment).generate()];
        break;
      case TangramType.BOTTOM_LEFT:
        rays = [bottomLeftCorner, ...new Arc(bottomLeftCorner, this.height, Math.PI * 1.5, Math.PI * 2, this.divisions, this.alignment).generate()];
        break;
      case TangramType.BOTTOM_RIGHT:
        rays = [bottomRightCorner, ...new Arc(bottomRightCorner, this.height, Math.PI, Math.PI * 1.5, this.divisions, this.alignment).generate()];
        break;
      default:
        rays = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner];
    }
    if (this.reverse) {
      rays = rays.reverse();
    }
    if (this.center.direction) {
      rays.forEach((r) => {
        GeomHelpers.rotateRayAboutOrigin(this.center, r);
      });
    }
    return rays;
  }
  clone() {
    const s = new RoundedTangram(this.center, this.width, this.height, this.type, this.divisions, this.alignment, this.reverse);
    s.isHole = this.isHole;
    s.hidden = this.hidden;
    s.style = Object.assign({}, this.style);
    return s;
  }
}