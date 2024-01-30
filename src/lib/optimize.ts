import { Segment } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

export class Optimize {

  static segments(segs: Segment[], noSplitColinear = false, trimSmall = true, smallDist = 0.1): Segment[] {

    const start = Date.now();

    let simpleSegs: Segment[] = [];
    segs.forEach((seg) => {
      for (let i = 0; i < seg.points.length - 1; i++) {
        simpleSegs.push(new Segment([seg.points[i], seg.points[i + 1]]));
      }
    });

    const sb = simpleSegs.concat();
    segs = [];

    while (sb.length) {
      let s = sb.shift();
      if (!s) continue;
      let n = segs.length
      let found = false;
      while (n--) {
        const sn = segs[n];
        if (sn && GeomHelpers.segmentsAreEqual(s, sn, smallDist * 0.5, false)) {
          found = true;
          break;
        }
      }
      if (!found) {
        segs.push(s);
      }
    }

    if (!noSplitColinear) {
      
      for (let n = 0; n < 3; n++) {
        let i = segs.length;
        let overlaps = 0;

        while (i--) {
          let segA = segs[i];
          let aa, ab, ba, bb, heading;
          for (let j = i - 1; j >= 0; j--) {
            let segB = segs[j];
            let same = false;
            let isRev = false;
            if (GeomHelpers.segmentsAreSameAngle(segA, segB)) {
              same = true;
              aa = segA.a.clone();
              ab = segA.b.clone();
              ba = segB.a.clone();
              bb = segB.b.clone();
            } else if (GeomHelpers.segmentsAreSameAngleRev(segA, segB)) {
              same = isRev = true;
              aa = segA.b.clone();
              ab = segA.a.clone();
              ba = segB.a.clone();
              bb = segB.b.clone();
            }
            if (aa && ab && ba && bb && same) {
              heading = GeomHelpers.angleBetweenPoints(aa, ab);
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
                segs.splice(i, 1);
                break;
              }
            }
          }
        }
      }

    }
    
    let i = segs.length;
    while (i--) {
      let seg = segs[i];
      if (!seg) {
        segs.splice(i, 1);
        continue;
      }
      if (trimSmall && GeomHelpers.distanceBetweenPoints(seg.a, seg.b) < smallDist) {
        segs.splice(i, 1);
        continue;
      }
    }

    let outSegs = segs.concat();

    if (segs.length > 1) {
      
      let joinedSegs: Segment[] = [];
      let orderedSegs: Segment[] = [];
      orderedSegs.push(segs[0]);
      segs.shift();
      let iter = 0;
      while (segs.length > 1) {
        if (iter > 10000) {
          orderedSegs = segs;
          console.warn("Optimize: too many iterations to reorder segs", orderedSegs.length);
          break;
        }
        let i = segs.length;
        let firstSeg = orderedSegs[0];
        let lastSeg = orderedSegs[orderedSegs.length - 1];
        let found = false;
        while (i--) {
          let seg = segs[i];
          if (GeomHelpers.pointsAreEqual(seg.a, lastSeg.b, 0.1)) {
            orderedSegs.push(seg);
            segs.splice(i, 1);
            found = true;
            break;
          }
          if (GeomHelpers.pointsAreEqual(seg.b, firstSeg.a, 0.1)) {
            orderedSegs.unshift(seg);
            segs.splice(i, 1);
            found = true;
            break;
          }
        }
        if (!found && segs.length) {
          if (orderedSegs.length) {
            let fs = new Segment([orderedSegs[0].a, ...orderedSegs.map(s => s.b)]);
            joinedSegs.push(fs);
          }
          orderedSegs = [segs[0]];
          segs.shift();
        }
        iter++;
      }
      if (segs.length) {
        let fs = new Segment([orderedSegs[0].a, ...orderedSegs.map(s => s.b)]);
        joinedSegs.push(fs);
      }
      outSegs = joinedSegs;
    }
    
    console.log("Optimized segments in " + (Date.now() - start) + " ms");
    return outSegs;

  }

}
