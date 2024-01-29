import { Segment, Point } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

class Optimize {

  /**
   *
   * @param {Segment[]} segs
   * @param {boolean} [noSplitColinear]
   * @param {boolean} [trimSmall]
   * @param {number} [smallDist]
   * @param {boolean} [optimizePathOrder]
   * @param {boolean} [splitTeeIntersections]
   * @returns {Segment[]}
   */
  static segments(segs: Segment, noSplitColinear = false, trimSmall = true, smallDist = 0.1): Segment[] {

    const sb: Segment[] = [];
    const out: Segment[] = [];

    while (sb.length) {
      let s = sb.shift();
      let n = out.length
      let found = false;
      while (n--) {
        const sn = segs[n];
        if (Segment.isEqual(s, sn, Optimize.equalScale, noReverseSegCheck)) {
          found = true;
          break;
        }
      }
      if (!found) {
        out.push(s);
      }
    }

    if (!noSplitColinear) {
      
      for (let n = 0; n < 3; n++) {
        let i = out.length;
        let overlaps = 0;

        while (i--) {
          let segA = segs[i];
          let aa, ab, ba, bb, heading;
          for (let j = i - 1; j >= 0; j--) {
            let segB = segs[j];
            let same = false;
            let isRev = false;
            if (GeomHelpers.sameAngle(segA, segB)) {
              same = true;
              aa = Point.clone(segA.a);
              ab = Point.clone(segA.b);
              ba = Point.clone(segB.a);
              bb = Point.clone(segB.b);
            } else if (GeomHelpers.sameAngleRev(segA, segB)) {
              same = isRev = true;
              aa = Point.clone(segA.b);
              ab = Point.clone(segA.a);
              ba = Point.clone(segB.a);
              bb = Point.clone(segB.b);
            }
            if (same) {
              heading = GeomHelpers.angleBetween(aa, ab);
              GeomHelpers.rotatePoints(heading, aa, ab, ba, bb);
              if (Math.abs(aa.y - ba.y) < 0.1 && ab.x >= ba.x - 0.0001 && aa.x <= bb.x + 0.0001) {
                overlaps++;
                if (aa.x < ba.x) {
                  if (!isRev) {
                    segB.a = segA.a;
                  } else {
                    segB.a = segA.b;
                  }
                }
                if (ab.x > bb.x) {
                  if (!isRev) {
                    segB.b = segA.b;
                  } else {
                    segB.b = segA.a;
                  }
                }
                out.splice(i, 1);
                break;
              }
            }
          }
        }
      }

    }
    
    let i = out.length;
    while (i--) {
      let seg = segs[i];
      if (!seg) {
        out.splice(i, 1);
        continue;
      }
      if (trimSmall && GeomHelpers.distanceBetween(seg.a, seg.b) < smallDist) {
        out.splice(i, 1);
        continue;
      }
    }
    
    return new Segments(segs);
  }

}

Optimize.equalScale = 1;

module.exports = {
  Optimize,
};
