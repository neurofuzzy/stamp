import { Line, EmptyLine, CircleLine, DiamondLine, HexagonLine, SquareLine, RaycastLine } from "../geom/lines";
import { Optimize } from "./optimize";
import { Sequence } from "./sequence";
import { Path, Point, Ray, Segment } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

const $ = (arg: unknown) =>
  arg === undefined 
    ? undefined : 
    typeof arg === "string"
      ? arg.indexOf("#") === 0 || arg.indexOf("0x") === 0
        ? parseInt(arg.replace("#", "0x"), 16)
        : Sequence.resolve(arg)
      : typeof arg === "number"
      ? arg
      : 0;

interface INode {
  fName: string;
  args: any[];
}

export class PenLine {

  static optimize = true;
  static trimOverlappingSegments = false;
  static STYLE_NONE = 0;
  static STYLE_DEFAULT = 1;
  static STYLE_CIRCLE = 2;
  static STYLE_SQUARE = 3;
  static STYLE_HEXAGON = 4;
  static STYLE_DIAMOND = 5;
  static STYLE_RAYCAST = 6;

  protected _center: Ray;
  protected _lineStyle;
  protected _nodes: INode[];
  protected _lines: Line[];
  protected _depth: number;
  protected _baked: boolean;

  constructor(center: Ray) {
    this._center = center;
    this._lineStyle = PenLine.STYLE_DEFAULT;
    this._nodes = [];
    this._lines = [];
    this._depth = 0;
    this._baked = false;
  }

  protected _setStyle (style: number | string): void {
    this._lineStyle = $(style) || 0;
  };

  protected _newLineOfCurrentStyle (hdg: number | string, len: number | string, segs?: number | string, stripes?: number | string, terminate?: number | string): Line {
    switch (this._lineStyle) {
      case PenLine.STYLE_NONE:
        return new EmptyLine($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
      case PenLine.STYLE_CIRCLE:
        return new CircleLine($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
      case PenLine.STYLE_SQUARE:
        return new SquareLine($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
      case PenLine.STYLE_HEXAGON:
        return new HexagonLine($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
      case PenLine.STYLE_DIAMOND:
        return new DiamondLine($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
      case PenLine.STYLE_RAYCAST:
        return new RaycastLine($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
      default:
        return new Line($(hdg) || 0, $(len) || 0, $(segs), $(stripes), ($(terminate) || 0) > 0.5);
    }
  };

  protected _appendLines (hdgs: number[], lens: number[], num: number, atDepth: number, segs: number[] = [], stripes: number[] = [], terminate: number[] = []) {
    let endLines = this.getEndLines();
    for (let i = 0; i < num; i++) {
      let hdg = hdgs[i];
      let len = lens[i];
      let seg = segs[i];
      let stripe = stripes[i];
      if (len === 0) {
        continue;
      }
      if (atDepth > 0) {
        endLines.forEach((endLine) => {
          let t = terminate[i % terminate.length] || 0;
          let line = this._newLineOfCurrentStyle(hdg, len, seg, stripe, t);
          endLine.append(line);

          if (line instanceof RaycastLine) {

            let lines = this._lines.concat();

            let acc: Segment[] = [];
            let segs = lines.reduce((arr, line) => arr.concat(line.toSegments()), acc);
            let seg2 = line.toSegments()[0];
            let hits = GeomHelpers.raycast(seg2.a, seg2.b, segs, true);
            if (hits.length) {
              line.terminate = true;
              line.setLength(hits[0].dist);
            }

          }
            
          this._lines.push(line);
        });
      } else {
        this._lines.push(this._newLineOfCurrentStyle(hdg, len, seg, stripe));
      }
    }
  };

  protected _clearTerminators () {
    this._lines.forEach((ln) => {
      ln.terminate = false;
    });
  };
  
  style(lineStyle: number | string) {
    this._nodes.push({ fName: "_setStyle", args: [lineStyle] });
    return this;
  }

  line(heading: number | string, length: number | string, segs?: number | string, stripes?: number | string, terminate?: number | string) {
    this._nodes.push({ fName: "_appendLines", args: [heading, length, 1, this._depth, segs, stripes, terminate] });
    this._depth++;
    return this;
  }

  lines(heading: number | string, length: number | string, num: number | string, segs?: number | string, stripes?: number | string, terminate?: number | string) {
    this._nodes.push({ fName: "_appendLines", args: [heading, length, num, this._depth, segs, stripes, terminate] });
    this._depth++;
    return this;
  }

  clearTerminators() {
    this._nodes.push({ fName: "_clearTerminators", args: [] });
    return this;
  }

  repeatLast(steps: number | string, times: number | string = 1) {
    this._nodes.push({ fName: "_repeatLast", args: [steps, times] });
    return this;
  }

  getEndLines(minDepth = 0, maxDepth = 100000, includeTerminators = false): Line[] {
    let acc: Line[] = [];
    let endLines = this._lines.reduce((arr, line) => {
      return arr.concat(line.endLines());
    }, acc);
    if (!includeTerminators) {
      endLines = endLines.filter((ln) => !ln.isTerminated());
    }
    endLines = endLines.filter((ln) => ln.depth() >= minDepth && ln.depth() <= maxDepth);
    endLines = endLines.filter((ln, idx) => endLines.indexOf(ln) === idx);
    return endLines;
  }

  getEndPoints(minDepth = 0, maxDepth = 100000, includeTerminators = false): Point[] {
    let endLines = this.getEndLines(minDepth, maxDepth, includeTerminators);
    let endPoints = endLines.map((ln) => ln.endPoint());
    endPoints.forEach((pt) => {
      pt.x += this._center.x;
      pt.y += this._center.y;
    });
    return endPoints;
  }

  setAmplitudeFunction(fn: (atLength: number) => number) {
    if (this._lines && this._lines.length) {
      this._lines[0].setAmplitudeFunc(fn);
    } else {
      throw new Error("cannot apply amplitude function before baking result");
    }
  }

  bake(rebake = false): PenLine {
    if (this._baked && !rebake) {
      return this;
    }

    this._baked = true;

    this._lines = [];

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
        i--;
        let len = nodes.length;
        let steps = $(args[0]) || 0;
        let times = $(args[1]) || 0;

        if (steps > 0 && steps <= len) {
          let r = nodes.slice(i - steps + 1, i + 1);
          let tmp = nodes.slice(0, i - steps + 1);
          let tmp2 = nodes.slice(i + 1, nodes.length);
          for (let j = 0; j < times; j++) {
            tmp = tmp.concat(r);
            i += steps;
          }
          nodes = tmp.concat(tmp2);
          if (i > 4096 || nodes.length > 4096) {
            console.error("too many nodes");
            break;
          }
        }
      }
    }

    const privateFunctionMap: { [key: string]: Function } = {
      _appendLines: this._appendLines,
      _setStyle: this._setStyle,
      _clearTerminators: this._clearTerminators,
    };


    for (let j = 0; j < nodes.length; j++) {
      let fName = nodes[j].fName;
      let fn = privateFunctionMap[fName];
      let args = nodes[j].args;

      // resolve all sequences
      if (fName == "_appendLines") {
        let hdgExpr = args[0];
        let lengthExpr = $(args[1]);
        let num = args[2];
        let atDepth = args[3];
        let segs = args[4];
        let stripes = args[5];
        let terminate = args[6];
        let hdgs = [];
        let terms = [];
        let lengths = [];
        let segsArr = [];
        let stripesArr = [];
        if (typeof num === "string") {
          num = Sequence.resolve(num, j);
        }
        for (let i = 0; i < num; i++) {
          if (typeof hdgExpr === "string") {
            hdgs.push(Sequence.resolve(hdgExpr, j));
          } else {
            hdgs.push(hdgExpr);
          }
          if (typeof terminate === "string") {
            terms.push(Sequence.resolve(terminate, j));
          } else {
            terms.push(terminate);
          }
          if (typeof lengthExpr === "string") {
            lengths.push(Sequence.resolve(lengthExpr, j));
          } else {
            lengths.push(lengthExpr);
          }
          if (typeof segs === "string") {
            segsArr.push(Sequence.resolve(segs, j));
          } else {
            segsArr.push(segs);
          }
          if (typeof stripes === "string") {
            stripesArr.push(Sequence.resolve(stripes, j));
          } else {
            stripesArr.push(stripes);
          }
        }
        args = [hdgs, lengths, num, atDepth, segsArr, stripesArr, terms];
      } else {
        args = args.map((arg) => {
          if (typeof arg === "string") {
            return Sequence.resolve(arg, j);
          }
          return arg;
        });
      }

      if (fn) {
        fn.apply(this, args);
      }
    }

    return this;
  }

  /**
   * @returns {Segments}
   */
  result(optimize = true, mergeConnectedPaths = true): Path[] {
    if (!this._baked) {
      this.bake();
    }

    let lines = this._lines.concat();

    let acc: Segment[] = [];
    let segs = lines.reduce((arr, line) => arr.concat(line.toSegments()), acc);
    const pts = [];
    segs.forEach((s) => {
      s.a.x += this._center.x;
      s.a.y += this._center.y;
      pts.push(s.a);
      s.b.x += this._center.x;
      s.b.y += this._center.y;
      pts.push(s.b);
    });

    if (optimize) {
      return Optimize.segments(segs.map((s) => s.toPath()), mergeConnectedPaths);
    }

    return segs.map((s) => s.toPath());
  }
}
