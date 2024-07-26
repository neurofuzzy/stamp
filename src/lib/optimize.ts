import { Path, Point, Segment } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

export class Optimize {

  static paths(paths: Path[], mergeConnectedPaths:boolean = true, noMergeSameHeadings:boolean = false): Path[] {

    let simpleSegs: Segment[] = [];
    paths.forEach((path) => {
      for (let i = 0; i < path.points.length - 1; i++) {
        simpleSegs.push(new Segment(path.points[i], path.points[i + 1]));
      }
    });

    return Optimize.segments(simpleSegs, mergeConnectedPaths, noMergeSameHeadings);

  }

  static segments(segs: Segment[], mergeConnectedPaths:boolean = true, noMergeSameHeadings:boolean = false): Path[] {

    const sb = segs.concat();
    const inSegs: Segment[] = [];

    while (sb.length) {
      let s = sb.shift();
      if (!s) continue;
      let n = inSegs.length
      let found = false;
      while (n--) {
        const sn = inSegs[n];
        if (sn && GeomHelpers.segmentsAreEqual(s, sn, 0.1, false)) {
          found = true;
          break;
        }
      }
      if (!found) {
        inSegs.push(s);
      }
    }

    if (!noMergeSameHeadings) {
      for (let n = 0; n < 3; n++) {
        let i = inSegs.length;
        let overlaps = 0;

        while (i--) {
          let segA = inSegs[i];
          let aa, ab, ba, bb, heading;
          for (let j = i - 1; j >= 0; j--) {
            let segB = inSegs[j];
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
                inSegs.splice(i, 1);
                break;
              }
            }
          }
        }
      }
    }
    
    let i = inSegs.length;
    while (i--) {
      let seg = inSegs[i];
      if (!seg) {
        inSegs.splice(i, 1);
        continue;
      }
      if (GeomHelpers.distanceBetweenPoints(seg.a, seg.b) < 0.1) {
        inSegs.splice(i, 1);
        continue;
      }
    }

    let outSegs: Path[] = inSegs.map((s) => s.toPath());

    if (mergeConnectedPaths && inSegs.length > 1) {

      let pointsScore: { [key: string]: number } = {};
      function pointKey(x: number, y: number) {
        return Math.round(x*10) + "," + Math.round(y*10);
      }

      for (let i = 0; i < inSegs.length; i++) {
        let seg = inSegs[i];
        pointsScore[pointKey(seg.a.x, seg.a.y)] = pointsScore[pointKey(seg.a.x, seg.a.y)] || 0;
        pointsScore[pointKey(seg.b.x, seg.b.y)] = pointsScore[pointKey(seg.b.x, seg.b.y)] || 0;
        pointsScore[pointKey(seg.a.x, seg.a.y)]++;
        pointsScore[pointKey(seg.b.x, seg.b.y)]++;
      }

      let joinedPaths: Path[] = [];
      let orderedSegs: Segment[] = [];
      orderedSegs.push(inSegs[0]);
      inSegs.shift();
      let iter = 0;
      while (inSegs.length > 1) {
        if (iter > 10000) {
          orderedSegs = inSegs;
          console.warn("Optimize: too many iterations to reorder segs", orderedSegs.length);
          break;
        }
        let i = inSegs.length;
        let firstSeg = orderedSegs[0];
        let lastSeg = orderedSegs[orderedSegs.length - 1];
        let found = false;
        let candidates: { seg: Segment; idx: number, isStart?: boolean, isReverse?: boolean, score: number }[] = [];
        while (i--) {
          let seg = inSegs[i];
          if (GeomHelpers.pointsAreEqual(seg.a, lastSeg.b, 0.1)) {
            candidates.push({ seg, idx: i, score: pointsScore[pointKey(seg.b.x, seg.b.y)] });
            found = true;
          }
          if (GeomHelpers.pointsAreEqual(seg.b, lastSeg.b, 0.1)) {
            candidates.push({ seg, idx: i, isReverse: true, score: pointsScore[pointKey(seg.a.x, seg.a.y)] });
            found = true;
          }
          if (GeomHelpers.pointsAreEqual(seg.b, firstSeg.a, 0.1)) {
            candidates.push({ seg, idx: i, isStart: true, score: pointsScore[pointKey(seg.a.x, seg.a.y)] });
            found = true;
          }
          if (GeomHelpers.pointsAreEqual(seg.a, firstSeg.a, 0.1)) {
            candidates.push({ seg, idx: i, isStart: true, isReverse: true, score: pointsScore[pointKey(seg.b.x, seg.b.y)] });
            found = true;
          }
        }
        if (found) {
          candidates.sort((a, b) => {
            if (a.score > b.score) return -1;
            if (a.score < b.score) return 1;
            return 0;
          });
          let newSeg = candidates[0].seg;
          if (candidates[0].isReverse) {
            let tmp = newSeg.a;
            newSeg.a = newSeg.b;
            newSeg.b = tmp;
          }
          if (candidates[0].isStart) {
            orderedSegs.unshift(newSeg);
          } else {
            orderedSegs.push(newSeg);
          }
          inSegs.splice(candidates[0].idx, 1);
        } else {
          if (orderedSegs.length) {
            let fs = new Path([orderedSegs[0].a, ...orderedSegs.map(s => s.b)]);
            joinedPaths.push(fs);
          }
          if (!inSegs.length) {
            break;
          }
          orderedSegs = [inSegs[0]];
          inSegs.shift();
        }
        iter++;
      }
      if (orderedSegs.length) {
        let fs = new Path([orderedSegs[0].a, ...orderedSegs.map(s => s.b)]);
        joinedPaths.push(fs);
      }
      if (inSegs.length) {
        joinedPaths = joinedPaths.concat(inSegs.map((s) => s.toPath()));
      }
      outSegs = joinedPaths;
    }
    
    return outSegs;

  }

}
