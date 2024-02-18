import { Line } from "./lines";
import { Optimize } from "../lib/optimize";
import { Sequence } from "../lib/sequence";

/**
 * @typedef Node
 * @property {String} fName
 * @property {Array<any>} args
 */

export class PenLine {
  constructor() {
    /** @type {number} */
    this.lineStyle = PenLine.STYLE_DEFAULT;

    /** @type {Node[]} */
    this._nodes = [];
    /** @type {Line[]} */
    this._lines = null;
    this._depth = 0;

    this.baked = false;

    this._setStyle = (style) => {
      this.lineStyle = style;
    };

    /**
     * @param {number} hdg
     * @param {number} len
     * @param {number} segs
     * @param {number} stripes
     * @param {boolean} terminate
     * @returns {Line}
     */
    this._newLineOfCurrentStyle = (hdg, len, segs = undefined, stripes = undefined, terminate = false) => {
      switch (this.lineStyle) {
        case PenLine.STYLE_NONE:
          return new Lines.EmptyLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_CIRCLE:
          return new Lines.CircleLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_CURVED:
          return new Lines.CurvedLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_ARROW:
          return new Lines.ArrowLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_SQUARE:
          return new Lines.SquareLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_ARC:
          return new Lines.ArcLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_OUTER_CURVED:
          return new Lines.OuterCurvedLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_WAVY:
          return new Lines.WavyLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_SAWTOOTH:
          return new Lines.SawtoothLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_SQUAREWAVE:
          return new Lines.SquareWaveLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_BUMPY:
          return new Lines.BumpyLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_PERP:
          return new Lines.PerpLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_HEXAGON:
          return new Lines.HexagonLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_DIAMOND:
          return new Lines.DiamondLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_TANGRAM:
          return new Lines.TangramLine(hdg, len, segs, stripes, terminate);
        case PenLine.STYLE_RAYCAST:
          return new Lines.RaycastLine(hdg, len, segs, stripes, terminate);
        default:
          return new Line(hdg, len, segs, stripes, terminate);
      }
    };
    this._appendLines = (hdgs, lens, num, atDepth, segs = undefined, stripes = undefined, terminate = false) => {
      let endLines = this.getEndLines();
      for (let i = 0; i < num; i++) {
        let hdg = hdgs[i];
        let len = lens[i];
        if (len === 0) {
          continue;
        }

        if (atDepth > 0) {
          endLines.forEach((endLine) => {
            let t = terminate;
            if (typeof t === "string") {
              let res = Sequence.resolve(t, atDepth);
              t = res > 50 ? false : true;
            }
            let line = this._newLineOfCurrentStyle(hdg, len, segs, stripes, t);
            endLine.append(line);
            this._lines.push(line);
          });
        } else {
          this._lines.push(this._newLineOfCurrentStyle(hdg, len, segs, stripes));
        }
      }
    };

    this._clearTerminators = () => {
      this._lines.forEach((ln) => {
        ln._terminate = false;
      });
    };
  }

  /**
   *
   * @param {number | string} lineStyle
   */
  style(lineStyle) {
    this._nodes.push({ fName: "_setStyle", args: [lineStyle] });
    return this;
  }

  /**
   *
   * @param {number | string} heading direction in degrees from parent
   * @param {number | string} length length of line
   * @param {number | string} [segs] number of (curve or iteration) segments
   * @param {number | string} [stripes] number of (concentric or period) repetitions
   * @param {number | string} [terminate] 0-1 chance of creating a terminator line (no more children)
   */
  line(heading, length, segs = undefined, stripes = undefined, terminate = 0) {
    this._nodes.push({ fName: "_appendLines", args: [heading, length, 1, this._depth, segs, stripes, terminate] });
    this._depth++;
    return this;
  }

  /**
   *
   * @param {number | string} heading direction in degrees from parent
   * @param {number | string} length length of line
   * @param {number | string} num number of lines to create (typically used if heading is a sequence expression)
   * @param {number | string} [segs] number of (curve or iteration) segments
   * @param {number | string} [stripes] number of (concentric or period) repetitions
   * @param {number | string} [terminate] 0-1 chance of creating a terminator line (no more children)
   */
  lines(heading, length, num, segs = undefined, stripes = undefined, terminate = 0) {
    this._nodes.push({ fName: "_appendLines", args: [heading, length, num, this._depth, segs, stripes, terminate] });
    this._depth++;
    return this;
  }

  clearTerminators() {
    this._nodes.push({ fName: "_clearTerminators", args: [] });
    return this;
  }

  /**
   *
   * @param {number | string} steps number of steps back in chain to go for repetition
   * @param {number | string} times number of times to repeat
   */
  repeatLast(steps, times = 1) {
    this._nodes.push({ fName: "_repeatLast", args: [steps, times] });
    return this;
  }

  /**
   *
   * @param {number} minDepth
   * @param {number} maxDepth
   * @param {boolean} includeTerminators
   * @returns {Line[]}
   */
  getEndLines(minDepth = 0, maxDepth = 100000, includeTerminators = false) {
    let endLines = this._lines.reduce((arr, line) => {
      return arr.concat(line.endLines());
    }, []);
    if (!includeTerminators) {
      endLines = endLines.filter((ln) => !ln.isTerminated());
    }
    endLines = endLines.filter((ln) => ln.depth() >= minDepth && ln.depth() <= maxDepth);
    endLines = endLines.filter((ln, idx) => endLines.indexOf(ln) === idx);
    return endLines;
  }

  /**
   *
   * @param {number} minDepth
   * @param {number} maxDepth
   * @param {boolean} includeTerminators
   * @returns {Point[]}
   */
  getEndPoints(minDepth = 0, maxDepth = 100000, includeTerminators = false) {
    let endLines = this.getEndLines(minDepth, maxDepth, includeTerminators);
    return endLines.map((ln) => ln.endPoint());
  }

  /**
   *
   * @param {(atLength:number) => void} fn
   */
  setAmplitudeFunction(fn) {
    if (this._lines && this._lines.length) {
      this._lines[0].setAmplitudeFunc(fn);
    } else {
      throw new Error("cannot apply amplitude function before baking result");
    }
  }

  /**
   * Bakes the boolean solution into a final <CombinedLine>
   * @param {boolean} rebake whether to re-bake a baked line
   */
  bake(rebake = false) {
    if (this.baked && !rebake) {
      return;
    }

    this.baked = true;

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
        let steps = args[0];
        let times = args[1];

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

    for (let j = 0; j < nodes.length; j++) {
      let fName = nodes[j].fName;
      let fn = this[fName];
      let args = nodes[j].args;

      // resolve all sequences
      if (fName == "_appendLines") {
        let hdgExpr = args[0];
        let lengthExpr = args[1];
        let num = args[2];
        let atDepth = args[3];
        let segs = args[4];
        let stripes = args[5];
        let terminate = args[6];
        let hdgs = [];
        let lengths = [];
        if (typeof num === "string") {
          num = Sequence.resolve(num, j);
        }
        for (let i = 0; i < num; i++) {
          if (typeof hdgExpr === "string") {
            hdgs.push(Sequence.resolve(hdgExpr, j));
          } else {
            hdgs.push(hdgExpr);
          }
        }
        for (let i = 0; i < num; i++) {
          if (typeof lengthExpr === "string") {
            lengths.push(Sequence.resolve(lengthExpr, j));
          } else {
            lengths.push(lengthExpr);
          }
        }
        if (typeof segs === "string") {
          segs = Sequence.resolve(segs, j);
        }
        if (typeof stripes === "string") {
          stripes = Sequence.resolve(stripes, j);
        }
        args = [hdgs, lengths, num, atDepth, segs, stripes, terminate];
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
  result(optimize = true, noSplitColinear = false, trimSmall = true, smallDist= 1, optimizePathOrder = false, splitTeeIntersections = false, splitCrossIntersections = false) {
    if (!this.baked) {
      this.bake();
    }

    let lines = this._lines.concat();

    let i = lines.length;

    /** @type {Segment[]} */
    let segs = lines.reduce((arr, line) => arr.concat(line.toSegments()), []);

    if (optimize) {
      return Optimize.segments(segs, noSplitColinear, trimSmall, smallDist, optimizePathOrder, splitTeeIntersections, splitCrossIntersections);
    }

    return new Segments(segs);
  }
}

PenLine.optimize = true;
PenLine.trimOverlappingSegments = false;

PenLine.STYLE_NONE = 0;
PenLine.STYLE_DEFAULT = 1;
PenLine.STYLE_CIRCLE = 2;
PenLine.STYLE_CURVED = 3;
PenLine.STYLE_ARROW = 4;
PenLine.STYLE_SQUARE = 5;
PenLine.STYLE_ARC = 6;
PenLine.STYLE_OUTER_CURVED = 7;
PenLine.STYLE_WAVY = 8;
PenLine.STYLE_SAWTOOTH = 9;
PenLine.STYLE_SQUAREWAVE = 10;
PenLine.STYLE_BUMPY = 11;
PenLine.STYLE_PERP = 12;
PenLine.STYLE_HEXAGON = 13;
PenLine.STYLE_DIAMOND = 14;
PenLine.STYLE_TANGRAM = 15;
PenLine.STYLE_RAYCAST = 16;

module.exports = {
  PenLine,
};
