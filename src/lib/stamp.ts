import * as clipperLib from "js-angusj-clipper/web";
import {
  BoundingBox,
  BoundingCircle,
  Heading,
  IShape,
  IStyle,
  Path,
  Point,
  Ray,
  ShapeAlignment,
} from "../geom/core";
import { GeomHelpers } from "../geom/helpers";
import { AbstractShape, Polygon } from "../geom/shapes";
import { ClipperHelpers } from "./clipper-helpers";
import { Optimize } from "./optimize";
import { StampProvider } from "./stamp-provider";
import {
  cloneNode,
  paramsWithDefaults,
  resolveStyle,
  resolveStringOrNumber,
} from "./stamp-helpers";
import {
  IArchParams,
  IBoneParams,
  IBoundsParams,
  ICircleParams,
  IEllipseParams,
  ILeafShapeParams,
  INode,
  IPolygonParams,
  IRectangleParams,
  IRoundedRectangleParams,
  IStampParams,
  IStyleMap,
  ITangramParams,
  ITrapezoidParams,
  IShapeContext,
  IShapeHandlerRegistry,
  IShapeHandler,
  ISetBoundsParams,
  ISetCursorBoundsParams,
  IMoveToParams,
  IMoveParams,
  IMoveOverParams,
  IForwardParams,
  IOffsetParams,
  IRotateToParams,
  IRotateParams,
  ICropParams,
  IBooleanParams,
  ISetParams,
  IRemoveTagParams,
  ISkipTagParams,
  IReplaceVariableParams,
  IRepeatLastParams,
  IStepBackParams,
  IPathParams,
} from "./stamp-interfaces";
import { defaultShapeRegistry } from "./stamp-shape-handlers";
import * as StampConstants from "./stamp-constants";
import { clipUnclippedShapes } from "./shape-clipper";

const $ = resolveStringOrNumber;

export class Stamp extends AbstractShape implements IShapeContext {
  private _nodes: INode[] = [];
  private _tree: clipperLib.PolyTree | null = null;
  private _polys: Polygon[] = [];
  private _unclippedShapes: {
    mode: number;
    shape: IShape;
    outln: number;
    scale: number;
  }[] = [];
  private _boundsStart: number = 0;
  private _boundsEnd: number = 0;
  private _currentBounds: BoundingBox = new BoundingBox(0, 0, 0, 0);
  private _overrideBounds: BoundingBox | null = null;
  private _flipBeforeClip: boolean = false;
  private _styleMap: IStyleMap[] = [];
  private _mode: number = StampConstants.UNION;
  private _cursor: Ray = new Ray(0, 0, 0);
  private _cursorHistory: Ray[] = [];
  private _cursorBounds: BoundingBox = new BoundingBox(0, 0, 0, 0);
  private _cropBounds: BoundingBox = new BoundingBox(0, 0, 0, 0);
  private _baked: boolean = false;
  private _bakedAlignmentOffset: Point = new Point(0, 0);
  private _shapeRegistry: IShapeHandlerRegistry;

  constructor(
    center?: Ray,
    alignment: ShapeAlignment = ShapeAlignment.CENTER,
    reverse: boolean = false,
    shapeRegistry?: IShapeHandlerRegistry
  ) {
    super(center, 1, alignment, reverse);
    this._shapeRegistry = shapeRegistry || defaultShapeRegistry;
  }

  boundingCircle(): BoundingCircle {
    if (this._overrideBounds) {
      const scale = this.scale || 1;
      return new BoundingCircle(
        this.center.x,
        this.center.y,
        Math.max(
          this._overrideBounds.width * scale,
          this._overrideBounds.height * scale
        ) / 2
      );
    }
    return super.boundingCircle();
  }

  boundingBox(): BoundingBox {
    if (this._overrideBounds) {
      const scale = this.scale || 1;
      return new BoundingBox(
        this.center.x - (this._overrideBounds.width / 2) * scale,
        this.center.y - (this._overrideBounds.height / 2) * scale,
        this._overrideBounds.width * scale,
        this._overrideBounds.height * scale
      );
    }
    return super.boundingBox();
  }

  private _reset() {
    this._tree = null;
    this._polys = [];
    this._unclippedShapes = [];
    this._styleMap = [];
    this._mode = StampConstants.UNION;
    this._baked = false;
    this._cursor.x = this._cursor.y = this._cursor.direction = 0;
    this._cursorHistory = [];
  }

  private _defaultStyle(style: IStyle) {
    this.style = style;
  }

  private _add() {
    this._mode = StampConstants.UNION;
  }

  private _subtract() {
    this._mode = StampConstants.SUBTRACT;
  }

  private _intersect() {
    this._mode = StampConstants.INTERSECT;
  }

  private _boolean(type: string | number) {
    if (typeof type === "string") {
      type = $(type);
    }
    switch (type) {
      case 0:
        this._mode = StampConstants.NONE;
        break;
      case 1:
        this._mode = StampConstants.UNION;
        break;
      case 2:
        this._mode = StampConstants.SUBTRACT;
        break;
      case 3:
        this._mode = StampConstants.INTERSECT;
        break;
      default:
        this._mode = StampConstants.UNION;
        break;
    }
  }

  private _breakApart() {
    let newPolys: Polygon[] = [];

    const ungroupAll = (poly: Polygon) => {
      if (poly.children().length > 0) {
        poly.children().forEach((p) => ungroupAll(p as Polygon));
      } else {
        newPolys.push(poly);
      }
    };

    if (this._polys.length >= 1) {
      this._polys.forEach((p) => {
        ungroupAll(p);
      });
      this._polys = newPolys;
    }
  }

  private _set(sequenceCall: string) {
    if (sequenceCall.indexOf("()") == -1) {
      sequenceCall += "()";
    }
    $(sequenceCall);
    this._cursorHistory.push(this._cursor.clone());
  }

  private _setCursorBounds(
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this._cursorBounds.x = x;
    this._cursorBounds.y = y;
    this._cursorBounds.width = width;
    this._cursorBounds.height = height;
  }

  private _moveTo(x: number | string, y: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    if (x !== undefined) {
      this._cursor.x = $(x);
    }
    if (y !== undefined) {
      this._cursor.y = $(y);
    }
  }

  private _move(x: number | string, y: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    const v = new Point($(x), $(y));
    GeomHelpers.rotatePoint(v, this._cursor.direction);
    this._cursor.x += v.x;
    this._cursor.y += v.y;
  }

  private _markBoundsStart() {
    this._boundsStart = this._unclippedShapes.length;
    this._boundsEnd = 100000;
  }

  private _markBoundsEnd() {
    this._boundsEnd = this._unclippedShapes.length;
  }

  private _moveOver(heading: number, perc: number = 1) {
    this._cursorHistory.push(this._cursor.clone());
    switch (heading) {
      case Heading.UP:
        this._cursor.y -= this._currentBounds.height * perc;
        break;
      case Heading.RIGHT:
        this._cursor.x += this._currentBounds.width * perc;
        break;
      case Heading.DOWN:
        this._cursor.y += this._currentBounds.height * perc;
        break;
      case Heading.LEFT:
        this._cursor.x -= this._currentBounds.width * perc;
        break;
    }
  }

  private _forward(distance: number) {
    this._cursorHistory.push(this._cursor.clone());
    distance = $(distance);
    var sinAng = Math.sin(this._cursor.direction);
    var cosAng = Math.cos(this._cursor.direction);
    this._cursor.x += sinAng * distance;
    this._cursor.y -= cosAng * distance;
  }

  private _rotateTo(r: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    this._cursor.direction = ($(r) * Math.PI) / 180;
  }

  private _rotate(r: number | string) {
    this._cursorHistory.push(this._cursor.clone());
    const rdeg = $(r);
    const rn = (rdeg * Math.PI) / 180;
    this._cursor.direction = GeomHelpers.normalizeAngle(
      this._cursor.direction + rn
    );
  }

  private _crop(x: number, y: number, width: number, height: number) {
    this._cropBounds.x = x;
    this._cropBounds.y = y;
    this._cropBounds.width = width;
    this._cropBounds.height = height;
  }

  private _stepBack(steps: number | string) {
    const sn = $(steps);
    for (let i = 0; i < sn; i++) {
      let c = this._cursorHistory.pop();
      if (c) {
        this._cursor = c;
      } else {
        break;
      }
    }
  }

  private _make(shapes: IShape[], outln: number = 0, scale: number = 1) {
    scale = scale || 1;
    if (this._cursorBounds.width > 0 && this._cursorBounds.height > 0) {
      if (
        !GeomHelpers.pointIsWithinBoundingBox(this._cursor, this._cursorBounds)
      ) {
        return;
      }
    }
    for (let i = 0; i < shapes.length; i++) {
      let shape: IShape | undefined = shapes[i];

      if (!shape) {
        break;
      }

      let g: IShape = shape.clone();

      // TODO: make shape clone copy style
      if (shape.style) {
        g.style = Object.assign({}, shape.style);
      }

      g.center.x += this.center.x + this._cursor.x;
      g.center.y += this.center.y + this._cursor.y;
      g.center.direction += this.center.direction + this._cursor.direction;

      this._unclippedShapes.push({
        mode: this._mode,
        shape: g,
        outln: outln,
        scale: scale,
      });
    }
    // set bounding box from bounding boxes of all shapes since last markBoundsStart
    this._currentBounds = GeomHelpers.shapesBoundingBox(
      this._unclippedShapes
        .slice(this._boundsStart, this._boundsEnd)
        .map((s) => s.shape)
    );
  }

  private _getGroupOffset(nx = 1, ny = 1, spx = 0, spy = 0): Point {
    const pt = new Point(0, 0);
    pt.x = (nx - 1) * spx * StampConstants.GROUP_OFFSET_FACTOR;
    pt.y = (ny - 1) * spy * StampConstants.GROUP_OFFSET_FACTOR;
    return pt;
  }

  // IShapeContext interface methods
  getGroupOffset(nx: number, ny: number, spx: number, spy: number): Point {
    return this._getGroupOffset(nx, ny, spx, spy);
  }

  make(
    shapes: IShape[],
    outlineThickness: number = 0,
    scale: number = 1
  ): void {
    this._make(shapes, outlineThickness, scale);
  }

  getCursorDirection(): number {
    return this._cursor.direction;
  }

  resolveStringOrNumber(value: string | number): number {
    return $(value);
  }

  /**
   * Register a custom shape handler
   */
  registerShapeHandler(shapeName: string, handler: IShapeHandler): void {
    this._shapeRegistry.register(shapeName, handler);
  }

  /**
   * Get the shape registry (for advanced use cases)
   */
  getShapeRegistry(): IShapeHandlerRegistry {
    return this._shapeRegistry;
  }

  /**
   * Helper method to add shape nodes with consistent processing
   */
  private _addShapeNode<T extends { tag?: string }>(
    functionName: string,
    params: T
  ): this {
    const processedParams = paramsWithDefaults<T>(params);
    this._nodes.push({
      fName: functionName,
      tag: processedParams.tag,
      args: [processedParams],
    });
    return this;
  }

  reset() {
    this._nodes.push({ fName: "_reset", args: Array.from(arguments) });
    return this;
  }

  defaultStyle(style: IStyle) {
    this._nodes.push({ fName: "_defaultStyle", args: [style] });
    return this;
  }

  noBoolean() {
    this._nodes.push({ fName: "_boolean", args: [StampConstants.NONE] });
    return this;
  }

  add() {
    this._nodes.push({ fName: "_add", args: Array.from(arguments) });
    return this;
  }

  subtract() {
    this._nodes.push({ fName: "_subtract", args: Array.from(arguments) });
    return this;
  }

  intersect() {
    this._nodes.push({ fName: "_intersect", args: Array.from(arguments) });
    return this;
  }

  boolean(params: IBooleanParams) {
    this._nodes.push({ fName: "_boolean", args: [params.type] });
    return this;
  }

  breakApart() {
    this._nodes.push({ fName: "_breakApart", args: [] });
    return this;
  }

  markBoundsStart(params?: IBoundsParams) {
    this._nodes.push({ fName: "_markBoundsStart", args: [params] });
    return this;
  }

  markBoundsEnd() {
    this._nodes.push({ fName: "_markBoundsEnd", args: [] });
    return this;
  }

  next() {
    this._nodes.push({ fName: "_next", args: Array.from(arguments) });
    return this;
  }

  set(params: ISetParams) {
    this._nodes.push({ fName: "_set", args: [params.sequenceCall] });
    return this;
  }

  setBounds(params: ISetBoundsParams) {
    this._overrideBounds = new BoundingBox(
      0,
      0,
      $(params.width),
      $(params.height)
    );
    return this;
  }

  setCursorBounds(params: ISetCursorBoundsParams) {
    this._nodes.push({
      fName: "_setCursorBounds",
      args: [params.x, params.y, params.width, params.height],
    });
    return this;
  }

  moveTo(params: IMoveToParams) {
    this._nodes.push({ fName: "_moveTo", args: [params.x, params.y] });
    return this;
  }

  move(params: IMoveParams) {
    this._nodes.push({ fName: "_move", args: [params.x || 0, params.y || 0] });
    return this;
  }

  moveOver(params: IMoveOverParams) {
    this._nodes.push({
      fName: "_moveOver",
      args: [params.direction, params.percentage || 1],
    });
    return this;
  }

  forward(params: IForwardParams) {
    this._nodes.push({ fName: "_forward", args: [params.distance || 0] });
    return this;
  }

  offset(params: IOffsetParams) {
    this._nodes.push({ fName: "_offset", args: [params.x, params.y || 0] });
    return this;
  }

  rotateTo(params: IRotateToParams) {
    this._nodes.push({ fName: "_rotateTo", args: [params.rotation || 0] });
    return this;
  }

  rotate(params: IRotateParams) {
    this._nodes.push({ fName: "_rotate", args: [params.rotation || 0] });
    return this;
  }

  /**
   * removes any nodes with the given tag
   * @param params
   * @returns
   */
  removeTag(params: IRemoveTagParams) {
    let i = this._nodes.length;
    while (i--) {
      if (this._nodes[i].tag === params.tag) {
        this._nodes.splice(i, 1);
        // reduce any repeatLasts steps by 1
        for (let j = i; j < this._nodes.length; j++) {
          if (this._nodes[j].fName === "_repeatLast") {
            this._nodes[j].args[0]--;
          }
        }
      }
    }
    return this;
  }

  skipTag(params: ISkipTagParams) {
    let i = this._nodes.length;
    while (i--) {
      if (this._nodes[i].tag === params.tag) {
        if (typeof this._nodes[i].args[0] === "object") {
          this._nodes[i].args[0].skip = params.condition;
        }
      }
    }
    return this;
  }

  /**
   * replaces any occurances of named sequences
   * @param params
   * @returns
   */
  replaceVariable(params: IReplaceVariableParams) {
    this._nodes.forEach((node) => {
      node.args.forEach((arg, idx) => {
        if (arg === params.oldName) {
          arg = params.newName;
        }
        if (arg === `${params.oldName}()`) {
          arg = `${params.newName}()`;
        }
        node.args[idx] = arg;
      });
    });
    return this;
  }

  /**
   * crops the stamp to the given bounds
   * @param params
   * @returns
   */
  crop(params: ICropParams) {
    this._nodes.push({
      fName: "_crop",
      args: [params.x, params.y, params.width, params.height],
    });
    return this;
  }

  circle(params: ICircleParams) {
    return this._addShapeNode("_circle", params);
  }

  arch(params: IArchParams) {
    return this._addShapeNode("_arch", params);
  }

  ellipse(params: IEllipseParams) {
    return this._addShapeNode("_ellipse", params);
  }

  leafShape(params: ILeafShapeParams) {
    return this._addShapeNode("_leafShape", params);
  }

  rectangle(params: IRectangleParams) {
    return this._addShapeNode("_rectangle", params);
  }

  trapezoid(params: ITrapezoidParams) {
    return this._addShapeNode("_trapezoid", params);
  }

  roundedRectangle(params: IRoundedRectangleParams) {
    return this._addShapeNode("_roundedRectangle", params);
  }

  bone(params: IBoneParams) {
    return this._addShapeNode("_bone", params);
  }

  polygon(params: IPolygonParams) {
    const processedParams = paramsWithDefaults<IPolygonParams>(params);
    processedParams.rayStrings = processedParams.rays.map((r) => r.toString());
    this._nodes.push({
      fName: "_polygon",
      tag: processedParams.tag,
      args: [processedParams],
    });
    return this;
  }

  stamp(params: IStampParams) {
    const newParams: IStampParams = { ...params };
    if (newParams.subStamp) {
      if (newParams.subStamp instanceof StampProvider) {
        newParams.providerIndex = newParams.subStamp.instanceIndex();
      } else {
        newParams.subStampString = newParams.subStamp.toString();
      }
      delete newParams.subStamp;
    }
    return this._addShapeNode("_stamp", newParams);
  }

  tangram(params: ITangramParams) {
    return this._addShapeNode("_tangram", params);
  }

  roundedTangram(params: ITangramParams) {
    return this._addShapeNode("_roundedTangram", params);
  }

  repeatLast(params: IRepeatLastParams) {
    this._nodes.push({
      fName: "_repeatLast",
      args: [params.steps, params.times || 1],
    });
    return this;
  }

  stepBack(params: IStepBackParams) {
    this._nodes.push({ fName: "_stepBack", args: [params.steps] });
    return this;
  }

  generate(): Ray[] {
    if (!this._baked) {
      this.bake();
    }
    return [];
  }

  children() {
    if (!this._baked) {
      this.bake();
    }
    return this._polys;
  }

  getCursor(): Ray {
    return this._cursor.clone();
  }

  path(params: IPathParams = {}): Path[] {
    const scale = $(params.scale || 1);
    const optimize = params.optimize !== false;
    const mergeConnectedPaths = params.mergeConnectedPaths !== false;

    if (!this._baked) {
      this.bake();
    }
    let points = this._cursorHistory.map((p) => new Point(p.x, p.y));
    points.push(this._cursor.clone());

    const offset = this._bakedAlignmentOffset;

    if (offset) {
      points.forEach((p) => {
        p.x += offset.x;
        p.y += offset.y;
      });
    }

    if (this.center) {
      points.forEach((p) => {
        p.x += this.center.x;
        p.y += this.center.y;
      });
    }

    if (scale !== 1) {
      points.forEach((p) =>
        GeomHelpers.scalePointRelativeToCenter(p, this.center, scale)
      );
    }

    let seg = new Path(points);

    if (optimize) {
      let optimizedSegs = Optimize.paths([seg], mergeConnectedPaths);
      return optimizedSegs;
    }

    return [seg];
  }

  private mapStyles() {
    // sort style map by bounds area
    const mappedPolys: Polygon[] = [];
    this._styleMap.sort((a, b) => {
      const areaA = a.bounds.area();
      const areaB = b.bounds.area();
      return areaA - areaB;
    });
    let i = this._styleMap.length;
    while (i--) {
      let styleArea = this._styleMap[i];
      for (let j = 0; j < this._polys.length; j++) {
        let poly = this._polys[j];
        if (
          GeomHelpers.shapeWithinBoundingBox(
            poly,
            styleArea.bounds,
            StampConstants.BOUNDS_TOLERANCE
          )
        ) {
          poly.style = styleArea.style;
          mappedPolys.push(poly);
        }
      }
    }
    const unmappedPolys = this._polys.filter(
      (poly) => !mappedPolys.includes(poly)
    );
    unmappedPolys.forEach((poly) => {
      poly.style = resolveStyle(this.style);
    });
  }

  /**
   * Flips the order of the shapes before clipping
   */
  flip() {
    this._flipBeforeClip = !this._flipBeforeClip;
    return this;
  }

  /**
   * Extends the stamp with another stamp
   */
  extends(other: Stamp) {
    const newNodes = other._nodes.map((node) => cloneNode(node));
    this._nodes.push(...newNodes);
    return this;
  }

  /**
   * Bakes the clipped solution into a final polytree
   * @param rebake whether to re-bake a baked shape
   */
  bake(rebake: boolean = false): Stamp {
    if (this._baked && !rebake) {
      return this;
    }

    this._baked = true;

    if (!this._nodes) {
      this._nodes = [];
    }

    let nodes = this._nodes.concat();
    let i = nodes.length;

    while (i--) {
      let node = nodes[i];
      if (!node) {
        continue;
      }
      let fName = node.fName;
      let args = node.args;

      if (fName === "_repeatLast") {
        nodes.splice(i, 1);
        let steps = args[0];
        let times = $(args[1]);

        if (steps > 0 && steps <= nodes.length) {
          let r = nodes.slice(i - steps, i);
          let tmp = nodes.slice(0, i);
          let tmp2 = nodes.slice(i, nodes.length);
          for (let j = 0; j < times; j++) {
            tmp = tmp.concat(r);
            i += steps;
          }
          nodes = tmp.concat(tmp2);
          if (
            i > StampConstants.MAX_NODES_LIMIT ||
            nodes.length > StampConstants.MAX_NODES_LIMIT
          ) {
            console.error("too many nodes");
            break;
          }
        }
      }
    }

    // Core function map (for linter and type safety)
    const privateFunctionMap: { [key: string]: Function } = {
      _add: this._add,
      _boolean: this._boolean,
      _crop: this._crop,
      _defaultStyle: this._defaultStyle,
      _forward: this._forward,
      _intersect: this._intersect,
      _markBoundsEnd: this._markBoundsEnd,
      _markBoundsStart: this._markBoundsStart,
      _move: this._move,
      _moveOver: this._moveOver,
      _moveTo: this._moveTo,
      _reset: this._reset,
      _rotate: this._rotate,
      _rotateTo: this._rotateTo,
      _set: this._set,
      _setCursorBounds: this._setCursorBounds,
      _stepBack: this._stepBack,
      _subtract: this._subtract,
      _breakApart: this._breakApart,
    };

    let breakApartTimes = 0;

    for (let i = 0; i < nodes.length; i++) {
      let fName = nodes[i].fName;
      let args = nodes[i].args;

      if (fName === "_breakApart") {
        breakApartTimes++;
        continue;
      }

      // Try shape handler first (convention: _shapeName -> shapeName handler)
      if (fName.startsWith("_")) {
        const handlerName = fName.substring(1); // Remove the underscore
        const handler = this._shapeRegistry.getHandler(handlerName);
        if (handler) {
          handler.handle(args[0], this);
          continue;
        }
      }

      // Fallback to core private functions
      const fn: Function = privateFunctionMap[fName];
      if (fn) {
        fn.apply(this, args);
      }
    }

    if (this._flipBeforeClip) {
      this._unclippedShapes.reverse();
    }

    const { tree, polys, styleMap } = clipUnclippedShapes(
      this._unclippedShapes,
      this._tree
    );
    this._tree = tree;
    this._polys = polys;
    this._styleMap = styleMap;

    if (this._tree) {
      if (this._cropBounds.width > 0 && this._cropBounds.height > 0) {
        const paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
        const pts = this._cropBounds.toPoints();
        pts.forEach((pt) => {
          pt.x += this.center.x;
          pt.y += this.center.y;
        });
        const clipRect = ClipperHelpers.shapeToClipperPaths(
          new Polygon(new Ray(0, 0), pts),
          1
        );
        const polyResult = ClipperHelpers.clipper.clipToPolyTree({
          clipType: clipperLib.ClipType.Intersection,
          subjectInputs: [{ data: paths, closed: true }],
          clipInputs: [clipRect],
          subjectFillType: clipperLib.PolyFillType.EvenOdd,
        });
        this._tree = polyResult;
      }
      this._polys = ClipperHelpers.polyTreeToPolygons(this._tree);
      for (let i = 0; i < breakApartTimes; i++) {
        this._breakApart();
      }
    }

    this.mapStyles();

    const offset = this.alignmentOffset();
    this._bakedAlignmentOffset = offset;

    const applyOffsetToPoly = (p: Polygon) => {
      p.rays.forEach((r) => {
        r.x += offset.x;
        r.y += offset.y;
      });
      p.children().forEach((child) => {
        if (child instanceof Polygon) {
          applyOffsetToPoly(child as Polygon);
        }
      });
    };

    const applyScaleToPoly = (p: Polygon) => {
      p.rays.forEach((r) =>
        GeomHelpers.scalePointRelativeToCenter(r, this.center, this.scale)
      );
      p.children().forEach((child) => {
        if (child instanceof Polygon) {
          applyScaleToPoly(child as Polygon);
        }
      });
    };

    this._polys.forEach(applyOffsetToPoly);
    this._polys.forEach(applyScaleToPoly);

    return this;
  }

  getNodes() {
    return this._nodes;
  }

  setNodes(nodes: INode[]): Stamp {
    this._nodes = nodes;
    return this;
  }

  toString(): string {
    return JSON.stringify([this._nodes]);
  }

  fromString(data: string): Stamp {
    try {
      let h = JSON.parse(data);
      this._nodes = h[0];
    } catch (err) {
      console.error(err);
    }
    return this;
  }

  clone(): Stamp {
    let stamp = new Stamp(this.center.clone(), this.alignment, this.reverse);
    stamp.hidden = this.hidden;
    stamp.isHole = this.isHole;
    stamp.scale = this.scale;
    if (this._overrideBounds) {
      stamp.setBounds({
        width: this._overrideBounds.width,
        height: this._overrideBounds.height,
      });
    }
    if (this._baked && this._tree) {
      // clone the tree by unioning it with an empty path
      let paths = ClipperHelpers.clipper.polyTreeToPaths(this._tree);
      const polyResult = ClipperHelpers.clipper.clipToPolyTree({
        clipType: clipperLib.ClipType.Union,
        subjectInputs: [{ data: paths, closed: true }],
        clipInputs: [{ data: [] }],
        subjectFillType: clipperLib.PolyFillType.EvenOdd,
      });
      stamp._tree = polyResult;
      return stamp;
    }
    return stamp.fromString(this.toString());
  }

  copy(stamp: Stamp): Stamp {
    // @ts-ignore
    this._nodes = stamp._nodes.concat();
    return stamp;
  }
}
