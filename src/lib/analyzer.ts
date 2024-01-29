import { Segment, Point } from "../geom/core";
import { GeomHelpers } from "../geom/helpers";

interface ISegsAndConnections {
  originalPts: { [key: string]: Point }, 
  pts: string[], 
  cxs: { [key: string]: string[] }
}

class Analyzer {
  
  static getSegsAndConnections(
    segs: Segment[], 
    splitTeeIntersections = false, 
    splitCrossIntersections = false
  ): ISegsAndConnections {

    segs = segs.concat();
    let n = segs.length;
    while (n--) {
      let seg = segs[n];
      if (!seg || seg.points.length <= 1) {
        segs.splice(n, 1);
      }
    }
    
    let cxs: { [key: string]: string[] } = {};
    let pts: string[] = [];
    let originalPts: { [key: string]: Point } = {};

    let token = (pt: Point) => {
      let t = `${Math.round(pt.x * 1)}|${Math.round(pt.y * 1)}`;
      originalPts[t] = pt;
      return t;
    }

    if (splitTeeIntersections) {

      // step 0, split segments that cross a point (T intersections);

      let allPts: Point[] = segs.map((seg) => seg.points).reduce((arr, pts) => {
        arr = arr.concat(pts);
        return arr;
      }, []);
      let j = allPts.length; 

      while(j--) {
        let ptA = allPts[j];
        if (!ptA) {
          allPts.splice(j, 1);
          break;
        }
        let i = j;
        while (i--) {
          let ptB = allPts[i];
          if (!ptB) {
            break;
          }
          if (GeomHelpers.pointsAreEqual(ptA, ptB)) {
            allPts.splice(j, 1);
            break;
          }
        }
      }

      let simpleSegs: Segment[] = [];
      segs.forEach((seg) => {
        for (let i = 0; i < seg.points.length - 1; i++) {
          let ptA = seg.points[i];
          let ptB = seg.points[i + 1];
          if (!GeomHelpers.pointsAreEqual(ptA, ptB)) {
            simpleSegs.push(new Segment([ptA, ptB]));
          }
        }
      })

      let i = segs.length;

      while (i--) {

        let seg = segs[i];

        let crossPts: Point[] = [];

        allPts.forEach(pt => {
          if (!pt) return;
          if (GeomHelpers.distancePointSegment(pt, seg) < 0.1) {
            if (!GeomHelpers.pointsAreEqual(pt, seg.a) && !GeomHelpers.pointsAreEqual(pt, seg.b)) {
              crossPts.push(pt);
            }
          }
        });

        if (crossPts.length) {

          crossPts.sort((ptA, ptB) => {
            const da = GeomHelpers.distanceBetweenPointsSquared(ptA, seg.a);
            const db = GeomHelpers.distanceBetweenPointsSquared(ptB, seg.a);
            if (da < db) {
              return -1; 
            } else if (da > db) {
              return 1;
            }
            return 0;
          });

          const newSegs = [];

          let ptA = seg.a;
          for (let k = 0; k < crossPts.length; k++) {
            let ptB = crossPts[k];
            newSegs.push(new Segment([ptA, ptB]));
            ptA = ptB;
          }
          newSegs.push(new Segment([ptA, seg.b.clone()]));

          segs.splice(i, 1, ...newSegs);

        }

      }

    }

    if (splitCrossIntersections) {

      let j = segs.length;
      while (j--) {
        let i = j;
        let found = false
        while (i--) {
          let segA = segs[j];
          let segB = segs[i];
          if (!segA || !segB) continue;
          let intPt: Point | null = GeomHelpers.segmentSegmentIntersect(segA, segB, true);
          if (intPt instanceof Point) {
            found = true;
            segs.splice(j, 1, new Segment([segA.a.clone(), intPt.clone()]), new Segment([intPt.clone(), segA.b.clone()]));
            segs.splice(i, 1, new Segment([segB.a.clone(), intPt.clone()]), new Segment([intPt.clone(), segB.b.clone()]));
          }
        }
        if (found) {
          j = segs.length;
        }
      }

    }

    // step 1, collect endpoints
    // step 2, filter out dupes
    // step 3, collect connected endpoints for each endpoint

    segs.forEach(seg => {
      let ta = token(seg.a);
      let tb = token(seg.b);
      if (!cxs[ta]) cxs[ta] = [];
      if (!cxs[tb]) cxs[tb] = [];
      if (cxs[ta].indexOf(tb) === -1) {
        cxs[ta].push(tb);
      }
      if (cxs[tb].indexOf(ta) === -1) {
        cxs[tb].push(ta);
      }
      if (pts.indexOf(ta) === -1) {
        pts.push(ta);
      }
      if (pts.indexOf(tb) === -1) {
        pts.push(tb);
      }
    });

    return { 
      originalPts,
      pts,
      cxs
    };

  }

  /**
   * @property {Segment[]} segs
   * @property {boolean} splitTeeIntersections
   * @returns {Segment[]}
   */
  static pathOrder (segs: Segment[], splitTeeIntersections = false, splitCrossIntersections = false): Segment[] {

    let res = [];
    let { originalPts, pts, cxs } = Analyzer.getSegsAndConnections(segs, splitTeeIntersections, splitCrossIntersections);

    let nekot = (str: string) => {
      return originalPts[str];
    };

    let byNumConnections = (ta: string, tb: string) => {
      if (cxs[ta].length > cxs[tb].length) {
        return 1;
      } else if (cxs[ta].length < cxs[tb].length) {
        return -1;
      }
      return 0;
    }

    // step 1, sort by number of connections, desc
    // step 2, choose first endpoint
    // step 3, pick the connected one with the lowest index that isn't in the stack, remove from connections list, push onto stack
    // step 4, resort by number of connections, desc
    // step 5, repeat step 6 until no more connections

    pts.sort(byNumConnections);

    while (pts.length) {

      pts.sort(byNumConnections);
      let ptA = pts.shift();

      while (ptA) {

        if (cxs[ptA].length) {
          
          cxs[ptA].sort(byNumConnections);
          let ptB = cxs[ptA].shift();

          let oppIdx = cxs[ptB].indexOf(ptA);
          if (oppIdx !== -1) cxs[ptB].splice(oppIdx, 1);

          res.push(new Segment(nekot(ptA), nekot(ptB), nekot(ptA).data));

          if (cxs[ptA].length) {
            pts.unshift(ptA);
          }

          ptA = ptB;

        } else {

          ptA = null;

        }

      }

    }

    let i = res.length;
    while (i--) {
      let seg = res[i];
      if (!seg) {
        res.splice(i, 1);
        continue;
      }
      if (GeomHelpers.distanceBetween(seg.a, seg.b) < 0.01) {
        res.splice(i, 1);
        continue;
      }
    }

    return res;

  }

    /**
   * @property {Segment[]} segs
   * @returns {Segment[]}
   */
  static outlinePath (segs) {

    let res = [];
    let { originalPts, pts, cxs } = Analyzer.getSegsAndConnections(segs, true, true);

    let nekot = str => {
      return originalPts[str];
    };

    // step 1, sort by number of connections, desc
    // step 2, choose first endpoint
    // step 3, pick the connected one with the lowest index that isn't in the stack, remove from connections list, push onto stack
    // step 4, resort by number of connections, desc
    // step 5, repeat step 6 until no more connections

    let firstPoint = null;
    let firstPtToken = null;
    pts.forEach(pt => {
      let npt = nekot(pt);
      if (!firstPoint) {
        firstPoint = npt;
        firstPtToken = pt;
        return;
      }
      if (npt.x < firstPoint.x) {
        firstPoint = npt;
        firstPtToken = pt;
      }
      if (GeomHelpers.pointsAreEqual(npt, firstPoint)) {
        if (npt.y < firstPoint.y) {
          firstPoint = npt;
          firstPtToken = pt;
        }
      }
    });

    let count = 0;
    let usedPts = [];

    let ptA = firstPtToken;

    while (ptA) {

      count++;

      if (count > 2000) {
        break;
      }

      usedPts.push(ptA);

      if (cxs[ptA].length) {

        let pt = nekot(ptA);

        cxs[ptA].sort((a, b) => {
          let apt = nekot(a);
          let bpt = nekot(b);
          let atheta = GeomHelpers.angleBetween(pt, apt);
          let btheta = GeomHelpers.angleBetween(pt, bpt);
          if (atheta < btheta) {
            return -1;
          } else if (atheta > btheta) {
            return 1;
          }
          return 0;
        })
        
        let ptB = null;
        let ok = false;

        while (!ok) {
          ptB = cxs[ptA].shift();
          if (usedPts.indexOf(ptB) === -1) {
            ok = true;
            break;
          }
          if (!ptB) {
            break;
          }
        }

        if (ok) {
          res.push(new Segment(nekot(ptA), nekot(ptB), nekot(ptA).data));
          ptA = ptB;
        }

      } else {

        ptA = null;

      }

    }


    let i = res.length;

    while (i--) {
      let seg = res[i];
      if (!seg) {
        res.splice(i, 1);
        continue;
      }
      if (GeomHelpers.distanceBetween(seg.a, seg.b) < 0.01) {
        res.splice(i, 1);
        continue;
      }

    }

    return res;

  }

  /**
   * @property {Segment[]} segs
   * @property {number} offset
   * @returns {Point[]}
   */
  static getEndingSegmentPoints (segs, offset = 0) {

    segs = segs.concat();
    segs = Analyzer.pathOrder(segs, true, true);

    let { originalPts, pts, cxs } = Analyzer.getSegsAndConnections(segs, true);

    let nekot = str => {
      return originalPts[str];
    };

    // return all points with one connection
    
    const endTokens = pts.filter(ta => cxs[ta].length === 1);

    const out = [];
    endTokens.forEach(tb => {
      const ptB = Point.clone(nekot(tb) );
      if (offset === 0) {
        out.push(ptB);
        return;
      }
      const ptA = nekot(cxs[tb]);
      const ang = GeomHelpers.angleBetween(ptA, ptB);
      const pt = new Point(0, offset);
      GeomHelpers.rotatePoint(pt, Math.PI * 0.5 - ang);
      GeomHelpers.addToPoint(ptB, pt);
      out.push(ptB);
    });

    return out;

  }

  /**
   * @property {Segment[]} segs
   * @property {number} searchMultiplier multiple of typical segmentation distance to search for flood-fill points
   * @returns {Point[][]}
   */
  static getFills (segs, searchMultiplier = 5) {

    segs = segs.concat();

    let { originalPts, pts, cxs } = Analyzer.getSegsAndConnections(segs, true, true);

    let token = pt => {
      let t = `${Math.round(pt.x * 1)}|${Math.round(pt.y * 1)}`;
      originalPts[t] = pt;
      return t;
    }

    let cenTokens = [];
    let pointGroups = [];

    // 1. iterate through all points
    // 2. for each point pick a each connection
    // 3. for each pair, proceed to find a winding polygon
    
    let minX = 100000;
    let minY = 100000;
    let maxX = -100000;
    let maxY = -100000;
    let minDx = 100000;
    let minDy = 100000;

    let ptArray = [];

    // get extents

    for (let token in originalPts) {
      let pt = originalPts[token];
      ptArray.push(pt);
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    }

    // get minimum spacing

    ptArray.sort((a, b) => {
      if (a.x < b.x) {
        return -1;
      } else if (a.x > b.x) {
        return 1;
      }
      return 0;
    });

    ptArray.forEach((ptA, idx) => {
      if (idx > 0) {
        let ptB = ptArray[idx - 1];
        let dx = Math.round(Math.abs(ptA.x - ptB.x));
        if (dx > 1) {
          minDx = Math.min(minDx, dx);
        }
      }
    });

    ptArray.sort((a, b) => {
      if (a.y < b.y) {
        return -1;
      } else if (a.y > b.y) {
        return 1;
      }
      return 0;
    });

    ptArray.forEach((ptA, idx) => {
      if (idx > 0) {
        let ptB = ptArray[idx - 1];
        let dy = Math.round(Math.abs(ptA.y - ptB.y));
        if (dy > 1) {
          minDy = Math.min(minDy, dy);
        }
      }
    });

    let hDx = minDx * 0.5;
    let hDy = minDy * 0.5;

    let rayPts = [];

    for (let j = minY; j < maxY; j += minDy) {
      for (let i = minX; i < maxX; i += minDx) {
        rayPts.push(new Point(i + hDx, j + hDy));
      }
    }

    rayPts.forEach(rayPt => {
      let nearPts = [];
      ptArray.forEach(pt => {
        let dist = GeomHelpers.distanceBetween(pt, rayPt);
        if (dist < Math.max(minDx, minDy) * searchMultiplier) {
          let ang = GeomHelpers.angleBetween(pt, rayPt);
          nearPts.push({
            pt,
            dist,
            ang
          });
        }
      });
      if (nearPts.length < 4) {
        return;
      }
      let i = nearPts.length;
      while (i--) {
        let nPt = nearPts[i].pt;
        let seg = new Segment(rayPt, nPt);
        let hits = GeomHelpers.segmentSegmentsIntersections(seg, segs, true);
        if (hits.length > 0) {
          nearPts.splice(i, 1);
        }
      }
      nearPts.sort((a, b) => {
        if (a.ang < b.ang) {
          return -1;
        } else if (a.ang > b.ang) {
          return 1;
        }
        return 0;
      });
      i = nearPts.length;
      while (i--) {
        let nPtA = nearPts[i].pt;
        let tokenA = token(nPtA);
        let j = nearPts.length;
        let ok = false;
        while (j--) {
          if (i === j) {
            continue;
          }
          let nPtB = nearPts[j].pt;
          let tokenB = token(nPtB);
          if (cxs[tokenA].indexOf(tokenB) === -1) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          nearPts.splice(i, 1);
        }
      }
      let ok = true;
      nearPts.forEach((npA, idx) => {
        let npB = nearPts[(idx + 1) % nearPts.length];
        let tokenA = token(npA.pt);
        let tokenB = token(npB.pt);
        if (cxs[tokenA].indexOf(tokenB) === -1) {
          ok = false;
        }
      });
      if (ok) {
        let polyPts = nearPts.map(nPt => nPt.pt).filter(pt => !!pt);
        if (!polyPts.length) return;
        let cen = GeomHelpers.averagePoints(...polyPts);
        let cenToken = token(cen);
        if (cenTokens.indexOf(cenToken) === -1) {
          cenTokens.push(cenToken);
          pointGroups.push(polyPts);
        }
      }
    });

    return pointGroups;

  }

}

module.exports = {
  Analyzer,
};
