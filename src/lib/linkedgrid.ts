export enum Direction {
  UP = 1,
  DN = 2,
  LT = 3,
  RT = 4
}

export class LinkedCell<T> {

  protected _neighbors: (LinkedCell<T> | null)[] = [];
  values: number[] = [];
  masks: boolean[] = [];
  items: T[] = [];
  protected _visited: boolean = false;
  protected _prev: LinkedCell<T> | null = null;

  constructor(up: LinkedCell<T> | null = null, down: LinkedCell<T> | null = null, left: LinkedCell<T> | null = null, right: LinkedCell<T> | null = null) {
    this.setNeighbor(Direction.UP, up);
    this.setNeighbor(Direction.DN, down);
    this.setNeighbor(Direction.LT, left);
    this.setNeighbor(Direction.RT, right);
  }

  setValue(layer: number, val: number) {
    this.values[layer] = val;
    return this;
  }

  setMask(layer: number, val: boolean) {
    this.masks[layer] = val;
    return this;
  }

  setItem(layer: number, val: T) {
    this.items[layer] = val;
    return this;
  }

  move(dir: Direction, num = 1): LinkedCell<T> | null {
    let lc = this._neighbors[dir - 1];
    while (--num && lc?._neighbors[dir - 1]) {
      lc = lc._neighbors[dir - 1];
    }
    return lc;
  }
  
  look(matchFn: (lc: LinkedCell<T>) => boolean, dir: Direction): LinkedCell<T> | null {
    let lc = this._neighbors[dir - 1];
    while (lc && !matchFn(lc)) {
      lc = lc._neighbors[dir - 1];
    }
    return lc;
  }

  neighbors (): (LinkedCell<T> | null)[] {
    return this._neighbors;
  }

  neighbor(dir: Direction): LinkedCell<T> | null {
    return this._neighbors[dir - 1];
  }

  setNeighbor(dir: Direction, n: LinkedCell<T> | null) {
    this._neighbors[dir - 1] = n;
    return this;
  }

  find(
    passFn: (lc: LinkedCell<T> | null) => boolean, 
    matchFn: (lc: LinkedCell<T> | null) => boolean, 
    maxRange = 10,
    findLimit = 1
    ): { cell:LinkedCell<T>, dist: number }[] 
  {
    let lcs: { cell: LinkedCell<T>, dist: number }[] = [{ cell: this, dist: 0 }];

    let ns = this._neighbors;
    let nns = [];
    let d = 0;

    let matches: { cell: LinkedCell<T>, dist: number }[] = [];
    let findLimitReached = false;

    while (ns.length) {
      d++;
      for (let n of ns) {
        if (n && matchFn(n)) {
          matches.push({ cell: n, dist: d });
          if (findLimit > 0 && matches.length === findLimit) {
            findLimitReached = true;
            break;
          }
        }
        if (n && n !== this && !n._visited && passFn(n)) {
          nns.push(...n.neighbors());
          n._visited = true;
          lcs.push({ cell: n, dist: d });
        }
      }
      ns = nns.filter(n => !!n);
      nns = [];
      if (d == maxRange) break;
      if (findLimitReached) break;
    }

    lcs.forEach(n => n.cell._visited = false);

    return matches;

  }

  findPath(
    passFn: (lc: LinkedCell<T> | null) => boolean, 
    matchFn: (lc: LinkedCell<T> | null) => boolean, 
    maxRange = 10
    ): LinkedCell<T>[] 
  {
    let lcs: { cell: LinkedCell<T>, dist: number }[] = [{ cell: this, dist: 0 }];

    let ns = this._neighbors;
    let nns = [];
    let d = 0;
    let done = false;
    let match = null;

    while (ns.length) {
      d++;
      for (let n of ns) {
        if (n && matchFn(n)) {
          match = n;
          done = true;
          break;
        }
        if (n && n !== this && !n._visited && passFn(n)) {
          nns.push(...n.neighbors());
          n._visited = true;
          n.neighbors().forEach(nb => {
            if (nb && !nb._prev) nb._prev = n;
          });
          lcs.push({ cell: n, dist: d });
        }
      }
      ns = nns.filter(n => !!n);
      nns = [];

      if (done) break;
      if (d == maxRange) break;
    }

    let path = [];

    if (match) {
      path.push(match);
      let i = 0;
      while (match._prev && match._prev !== this) {
        match = match._prev;
        path.unshift(match);
        i++;
        if (i > 100) break;
      }
    }

    lcs.forEach(n => {
      n.cell._prev = null;
      n.cell._visited = false;
    });

    return path;

  }

  getNeighborsWithinRange(
    passFn: (lc: LinkedCell<T> | null) => boolean, 
    maxRange = 1
    ): { cell:LinkedCell<T>, dist: number }[] 
  {
    let lcs: { cell: LinkedCell<T>, dist: number }[] = [{ cell: this, dist: 0 }];

    let ns = this._neighbors;
    let nns: (LinkedCell<T> | null)[] = [];
    let d = 0;

    while (ns.length) {
      d++;
      ns.forEach(n => {
        if (n && n !== this && !n._visited && passFn(n)) {
          nns.push(...n.neighbors());
          n._visited = true;
          lcs.push({ cell: n, dist: d });
        }
      });
      ns = nns.filter(n => !!n);
      nns = [];
      if (d == maxRange) break;
    }

    lcs.forEach(n => n.cell._visited = false);

    return lcs;

  }

  setDistance(
    passFn: (lc: LinkedCell<T> | null) => boolean, 
    distLayer = 0,
    dist = 1,
    doAdd = false,
    maxRange = 50
    )
  {
    if (!doAdd) this.values[distLayer] = 0;
    this.values[distLayer] += dist;

    let lcs: LinkedCell<T>[] = [this];

    let ns = this._neighbors;
    let nns: (LinkedCell<T> | null)[] = [];
    let d = dist;

    while (ns.length) {
      d++;
      ns.forEach(n => {
        if (n && n !== this && !n._visited && passFn(n)) {
          nns.push(...n.neighbors());
          n.values[distLayer] = d;
          n._visited = true;
          lcs.push(n);
        }
      });
      ns = nns.filter(n => !!n);
      nns = [];
      if (d == maxRange) break;
    }

    lcs.forEach(n => n._visited = false);

  }

}

export class LinkedGrid<T> {

  width: number;
  height: number;
  grid: LinkedCell<T>[][] = [];
  cells: LinkedCell<T>[] = [];

  constructor(width = 3, height = 3) {

    this.width = width;
    this.height = height;
    this.grid = [];
    this.cells = [];
    
    for (let j = 0; j < height; j++) {

      let row: LinkedCell<T>[] = [];
      this.grid.push(row);

      for (let i = 0; i < width; i++) {

        let cell = new LinkedCell<T>();
        this.cells.push(cell);
        row.push(cell);

      }

    }

    for (let j = 0; j < height; j++) {

      for (let i = 0; i < width; i++) {

        let cell = this.grid[j][i];
        cell.setNeighbor(Direction.UP, j > 0 ? this.grid[j - 1][i] : null);
        cell.setNeighbor(Direction.DN, j < height - 1 ? this.grid[j + 1][i] : null);
        cell.setNeighbor(Direction.LT, i > 0 ? this.grid[j][i - 1] : null);
        cell.setNeighbor(Direction.RT, i < width - 1 ? this.grid[j][i + 1] : null);

      }

    }

  }

  cell(x: number, y: number): LinkedCell<T> | null {
    if (x < 0 || y < 0) return null;
    if (x >= this.width || y >= this.height) return null;
    return this.grid[y][x];
  }

  setCell(x: number, y: number, n: LinkedCell<T>): boolean {
    if (x < 0 || y < 0) return false;
    if (x >= this.width || y >= this.height) return false;
    this.grid[y][x] = n;
    return true;
  }

  getCellCoordinates(cell: LinkedCell<T>): { x: number, y: number } | null {
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        if (this.grid[j][i] === cell) return { x: i, y: j };
      }
    }
    return null;
  }

  print(layer = 0) {
    return this.grid.map(
      row => row.map(
        cell => cell.values[layer] === undefined ? "--" : `${cell.values[layer]}`.padStart(2, "0")
      ).join("|")
    ).join("\n");
  }

}
