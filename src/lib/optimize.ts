import { Path, Segment } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

export class Optimize {

  static segments(paths: Path[], mergeConnectedPaths:boolean = true): Path[] {

    let simpleSegs: Segment[] = [];
    paths.forEach((path) => {
      for (let i = 0; i < path.points.length - 1; i++) {
        simpleSegs.push(new Segment(path.points[i], path.points[i + 1]));
      }
    });

    const sb = simpleSegs.concat();
    const segs: Segment[] = [];

    while (sb.length) {
      let s = sb.shift();
      if (!s) continue;
      let n = segs.length
      let found = false;
      while (n--) {
        const sn = segs[n];
        if (sn && GeomHelpers.segmentsAreEqual(s, sn, 0.1, false)) {
          found = true;
          break;
        }
      }
      if (!found) {
        segs.push(s);
      }
    }

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
    
    let i = segs.length;
    while (i--) {
      let seg = segs[i];
      if (!seg) {
        segs.splice(i, 1);
        continue;
      }
      if (GeomHelpers.distanceBetweenPoints(seg.a, seg.b) < 0.1) {
        segs.splice(i, 1);
        continue;
      }
    }

    let outSegs: Path[] = segs.map((s) => s.toPath());

    if (mergeConnectedPaths && segs.length > 1) {
      
      let joinedPaths: Path[] = [];
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
            let fs = new Path([orderedSegs[0].a, ...orderedSegs.map(s => s.b)]);
            joinedPaths.push(fs);
          }
          orderedSegs = [segs[0]];
          segs.shift();
        }
        iter++;
      }
      if (orderedSegs.length) {
        let fs = new Path([orderedSegs[0].a, ...orderedSegs.map(s => s.b)]);
        joinedPaths.push(fs);
      }
      if (segs.length) {
        joinedPaths = joinedPaths.concat(segs.map((s) => s.toPath()));
      }
      outSegs = joinedPaths;
    }
    
    return outSegs;

  }

}
