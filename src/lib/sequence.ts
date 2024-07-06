import * as arbit from "arbit";

class SequenceReference {
  seq: Sequence
  useCurrent: boolean
  expressions: string[]
  constructor(seq: Sequence, useCurrent: boolean, expressions: string[] = []) {
    this.seq = seq;
    this.useCurrent = useCurrent;
    this.expressions = expressions;
  }
}

export class Sequence {

  static readonly ONCE = "once";
  static readonly REVERSE = "reverse";
  static readonly REPEAT = "repeat";
  static readonly YOYO = "yoyo";
  static readonly SHUFFLE = "shuffle";
  static readonly RANDOM = "random";
  static readonly BINARY = "binary";
  static readonly AS = "as";
  // accumulation types for sequences (i.e. REPEAT 10,20 ADD)
  static readonly REPLACE = "replace";
  static readonly ADD = "add";
  static readonly SUBTRACT = "subtract";
  static readonly MULTIPLY = "multiply";
  static readonly DIVIDE = "divide";
  static readonly LOG = "log";
  static readonly LOG2 = "log2";
  static readonly LOG10 = "log10";
  static readonly POW = "pow";
  static readonly ismaxIterations = /\(\d+\)/g;
  static seed = 0;
  static sequences: { [key:string]: Sequence } = {};
  static __prng: { (): number } | null = null;
  static random = () => {
    if (!Sequence.__prng === null) {
      Sequence.__prng = arbit(Sequence.seed);
    } else {
      return Sequence.__prng?.();
    }
  }
  static resetAll = (seed: number = NaN, skipSequeces: (Sequence | null)[] = []) => {
    Sequence.__prng = arbit(!isNaN(seed) ? seed : Sequence.seed);
    for (let alias in Sequence.sequences) {
      if (skipSequeces.indexOf(Sequence.sequences[alias]) !== -1) {
        continue;
      }
      if (!isNaN(seed)) {
        Sequence.sequences[alias].updateSeed(seed);
      } else {
        Sequence.sequences[alias].reset();
      }
    }
  }
  static reset = (alias: string) => {
    if (Sequence.sequences[alias]) {
      Sequence.sequences[alias].reset();
    }
  }
  static updateSeed = (alias: string, seed: number) => {
    if (Sequence.sequences[alias]) {
      Sequence.sequences[alias].updateSeed(seed);
    }
  }

  static readonly reserved: string[] = [Sequence.ONCE, Sequence.REVERSE, Sequence.REPEAT, Sequence.YOYO, Sequence.SHUFFLE, Sequence.RANDOM, Sequence.BINARY, Sequence.AS];
  static readonly types: string[] = [Sequence.ONCE, Sequence.REVERSE, Sequence.REPEAT, Sequence.YOYO, Sequence.SHUFFLE, Sequence.RANDOM, Sequence.BINARY];
  static readonly accumulators: string[] = [Sequence.REPLACE, Sequence.ADD, Sequence.SUBTRACT, Sequence.MULTIPLY, Sequence.DIVIDE, Sequence.LOG, Sequence.LOG2, Sequence.LOG10, Sequence.POW];

  _prevValue: number | Sequence;
  _currentValue: number | Sequence;
  _values: Array<number | Sequence>;
  _originalValues: Array<number | Sequence>;
  _maxIterations: number;
  _iterations: number;
  _accumulationType: string;
  _usedValues: Array<number | Sequence>;
  _pick: Function;
  _seed: number;
  _firstPick: boolean;
  _binaryLength: number;
  _prng: any;
  started: boolean;
  done: boolean;
  
  constructor(values: Array<number | Sequence>, pickerFunction: Function, maxIterations: number, accumulationType: string, seed?: number, binaryLength?: number) {
    this._prevValue = NaN;
    /** @type {number | Sequence} */
    this._currentValue = NaN;
    this._values = values;
    this._originalValues = values.concat();
    this._maxIterations = maxIterations;
    this._iterations = 0;
    this._accumulationType = accumulationType || Sequence.REPLACE;
    /** @type {Array<number | Sequence>} */
    this._usedValues = [];
    this._pick = pickerFunction;
    this._firstPick = true;
    this._seed = seed || Sequence.seed;
    this._binaryLength = binaryLength || 1;
    this._prng = arbit(this._seed);
    this.started = false;
    this.done = false;
  }

  updateSeed(seed: number) {
    this._seed = seed;
    this.reset();
  }

  reset() {
    this._prevValue = NaN;
    this._currentValue = NaN;
    this._values = this._originalValues.concat();
    this._iterations = 0;
    this._firstPick = true;
    this._usedValues = [];
    this._prng = arbit(this._seed);
    this.done = false;
  }

  current(forceRefNext: boolean = false): number {
    this.started = true;
    let out = 0;
    if (this._currentValue instanceof SequenceReference) {
      if (!forceRefNext && this._currentValue.seq.started) {
        out = this._currentValue.seq.current();
      } else {
        out = this._currentValue.useCurrent ? this._currentValue.seq.current() : this._currentValue.seq.next();
      }
      if (this._currentValue.expressions.length) {
        out = eval(`${out} ${this._currentValue.expressions.join(" ")}`);
      }
    } else if (typeof this._currentValue === "number") {
      out = this._currentValue;
    }
    if (typeof this._prevValue === "number") {
      if (isNaN(this._prevValue)) {
        if (this._accumulationType === Sequence.REPLACE) {
          this._prevValue = 0;
        } else {
          this._prevValue = out;
        }
      }
      switch (this._accumulationType) {
        case Sequence.ADD:
          return this._prevValue + out;
        case Sequence.SUBTRACT:
          return this._prevValue - out;
        case Sequence.MULTIPLY:
          return this._prevValue * out;
        case Sequence.DIVIDE:
          if (out === 0) {
            return 0;
          }
          return this._prevValue / out;
        case Sequence.LOG:
          return Math.log(Math.max(Math.abs(1 + this._seed + this._iterations * out), 1));
        case Sequence.LOG2:
          return Math.log2(Math.max(Math.abs(1 + this._seed + this._iterations * out), 1));
        case Sequence.LOG10:
          return Math.log10(Math.max(Math.abs(1 + this._seed + this._iterations * out), 1));
        case Sequence.POW:
          return Math.pow(out, this._iterations) - out;
        default:
          return out;
      }
    }
    return out;
  }

  next(): number {
    this._prevValue = this.current();
    this._pick(this);
    return this.current(true);
  }

  static fromStatement(stmt: string, seed?: number, binaryLength: number = 1): Sequence | null {
    if (!stmt) {
      return null;
    }

    stmt = stmt.toLowerCase();

    if (stmt.indexOf(",") === -1 && stmt.indexOf("(") !== -1 && stmt.indexOf(" (") === -1) {
      stmt = stmt.split("(").join(" (");
    }

    stmt = stmt.split(", ").join(",");

    let tokens = stmt.split(" ");
    let type = Sequence.ONCE;
    let iterations = 0;
    let valuesExp = "";
    /** @type {Array<number | Sequence>} */
    let values = [];
    let picker = null;
    let alias = "";
    let accumIndex = 2;

    if (Sequence.types.indexOf(tokens[0]) !== -1) {
      type = tokens[0];
      if (Sequence.ismaxIterations.test(tokens[1])) {
        iterations = parseInt(tokens[1].substr(1, tokens[1].length - 1));
        valuesExp = tokens[2];
        accumIndex = 3;
      } else {
        valuesExp = tokens[1];
      }
    } else {
      valuesExp = tokens[0];
    }

    if (valuesExp.indexOf(",") !== -1) {
      const parsedValues = valuesExp.split(",");

      parsedValues.forEach((val) => {
        // if val contains a lowercase letter
        if (val.match(/[a-z]/) && val.indexOf("0x") === -1) {
          const isOperatorExpr = /([+-/*%//])/g;
          const exprs = val.split(isOperatorExpr);
          val = exprs.shift() as string;
          if (Sequence.sequences[val.split("(")[0]]) {
            values.push(new SequenceReference(
              Sequence.sequences[val.split("(")[0]], 
              val.indexOf("(") === -1,
              exprs),
            );
          }
        } else if (val.indexOf("[") !== -1 && val.indexOf("]") !== -1) {
          const repeatNum = parseInt(val.split("[")[1].split("]")[0]);
          const repeatVal = parseFloat(val.split("[")[0]);
          for (let i = 0; i < repeatNum; i++) {
            values.push(repeatVal);
          }
        } else if (val.indexOf("0x") === 0) {
          values.push(parseInt(val, 16));
        } else if (val.indexOf(".") === -1) {
          values.push(parseInt(val));
        } else {
          values.push(parseFloat(val));
        }
      });
    } else if (valuesExp.indexOf("-") != -1) {
      if (valuesExp.indexOf(".") === -1) {
        const rangeExp = valuesExp.split("-");
        const rangeMin = parseInt(rangeExp[0]);
        const rangeMax = parseInt(rangeExp[1]);
        for (let i = rangeMin; i <= rangeMax; i++) {
          values.push(i);
        }
      } else {
        const rangeExp = valuesExp.split("-");
        const factor = Math.max(
          Math.pow(10, rangeExp[0].split(".")[1].length),
          Math.pow(10, rangeExp[1].split(".")[1].length)
        );
        const rangeMin = parseFloat(rangeExp[0]);
        const rangeMax = parseFloat(rangeExp[1]);
        for (let i = Math.floor(rangeMin * factor); i <= Math.floor(rangeMax * factor); i++) {
          values.push(i / factor);
        }
      }
    } else if (!isNaN(parseFloat(valuesExp))) {
      values.push(parseFloat(valuesExp));
    }

    switch (type) {
      case Sequence.REVERSE:
        values = values.reverse();
        picker = Sequence._pickerDefault;
        break;
      case Sequence.REPEAT:
        picker = Sequence._pickerRepeat;
        break;
      case Sequence.YOYO:
        picker = Sequence._pickerYoyo;
        break;
      case Sequence.SHUFFLE:
        picker = Sequence._pickerShuffle;
        break;
      case Sequence.RANDOM:
        picker = Sequence._pickerRand;
        break;
      case Sequence.BINARY:
        picker = Sequence._pickerBinary;
        break;
      default:
        picker = Sequence._pickerDefault;
    }

    let accumulationType = Sequence.REPLACE;

    if (tokens.length >= accumIndex && Sequence.accumulators.indexOf(tokens[accumIndex]) !== -1) {
      accumulationType = tokens[accumIndex];
    }

    const seq = new Sequence(values, picker, iterations, accumulationType, seed, binaryLength);

    if (tokens.length > 2 && tokens[tokens.length - 2] == Sequence.AS && tokens[tokens.length - 1].length > 0) {
      alias = tokens[tokens.length - 1];
    } else {
      alias = stmt.split(" ").join("_");
    }

    if (alias && !Sequence.sequences[alias]) {
      Sequence.sequences[alias] = seq;
    }

    return seq;
  }

  static _pickerDefault(seq: Sequence) {
    if (!seq._values.length) {
      return;
    }
    const value = seq._values.shift();
    if (value !== undefined) {
      seq._currentValue = value;
      seq._usedValues.push(seq._currentValue);
    }
  }

  static _pickerRepeat(seq: Sequence) {
    if (seq.done) {
      return;
    }
    if (!seq._values.length) {
      seq._values = seq._usedValues;
      seq._usedValues = [];
    }
    const value = seq._values.shift();
    if (value !== undefined) {
      seq._currentValue = value;
      seq._usedValues.push(seq._currentValue);
    }
    if (!seq._values.length) {
      seq._iterations++;
      if (seq._maxIterations > 0 && seq._iterations === seq._maxIterations) {
        seq.done = true;
        return;
      }
    }
  }

  static _pickerYoyo(seq: Sequence) {
    if (seq.done) {
      return;
    }
    if (!seq._values.length) {
      seq._values = seq._usedValues;
      seq._usedValues = [];
    }
    const value = seq._values.shift();
    if (value !== undefined) {
      seq._currentValue = value;
      seq._usedValues.unshift(seq._currentValue);
    }
    if (!seq._values.length) {
      seq._iterations++;
      if (seq._maxIterations > 0 && seq._iterations === seq._maxIterations) {
        seq.done = true;
        return;
      }
    }
  }

  static shuffleSequence(seq: Sequence) {
    for (let i = seq._values.length - 1; i > 0; i--) {
      const j = Math.floor(seq._prng.nextInt(0, i));
      const temp = seq._values[i];
      seq._values[i] = seq._values[j];
      seq._values[j] = temp;
    }
  }

  static _pickerShuffle(seq: Sequence) {
    if (seq.done) {
      return;
    }
    if (isNaN(seq.current())) {
      Sequence.shuffleSequence(seq);
    }
    if (!seq._values.length) {
      seq._values = seq._usedValues;
      seq._usedValues = [];
    }
    const value = seq._values.shift();
    if (value !== undefined) {
      seq._currentValue = value;
      seq._usedValues.unshift(seq._currentValue);
    }
    if (!seq._values.length) {
      seq._iterations++;
      if (seq._maxIterations > 0 && seq._iterations === seq._maxIterations) {
        seq.done = true;
        return;
      }
    }
  }

  static _pickerRand(seq: Sequence) {
    if (seq.done) {
      return;
    }
    if (!seq._values.length) {
      seq._values = seq._usedValues;
      seq._usedValues = [];
    }
    if (!seq._usedValues.length) {
      Sequence.shuffleSequence(seq);
    }
    const value = seq._values.shift();
    if (value !== undefined) {
      seq._currentValue = value;
      seq._usedValues.unshift(seq._currentValue);
    }
    if (!seq._values.length) {
      seq._iterations++;
      if (seq._maxIterations > 0 && seq._iterations === seq._maxIterations) {
        seq.done = true;
        return;
      }
    }
  }
  
  static _pickerBinary(seq: Sequence) {
    if (seq.done) {
      return;
    }
    if (seq._firstPick) {
      const pickIdx = seq._iterations.toString(2).padStart(seq._binaryLength, "0").split("").map(Number);
      seq._values = pickIdx.map((idx) => seq._originalValues[idx]);
      seq._usedValues = [];
      seq._firstPick = false;
      if (seq._iterations === 0 && seq._seed > 0) {
        for (let i = 0; i < seq._seed; i++) {
          seq._values.shift();
        }
      }
    }
    const value = seq._values.shift();
    if (value !== undefined) {
      seq._currentValue = value;
      seq._usedValues.push(seq._currentValue);
    }
    
    if (!seq._values.length) {
      seq._iterations++;
      seq._firstPick = true;
      if (seq._iterations > Math.pow(2, seq._binaryLength)) {
        seq._iterations = 0;
      }
    }
  }

  static resolve(inputExpr: string, atDepth: number = 0): number {
    const isOperatorExpr = / ([+-/*%//]) /g;
    const exprs = inputExpr.split(isOperatorExpr).map((e) => e.toLowerCase().trim());

    const res = exprs.map((expr) => {
      const isOperator = /([+-/*%//])/g;
      const isNumeric = /^\d+$/;

      if (isOperator.test(expr) && expr.length == 1) {
        return ` ${expr} `;
      }

      if (isNumeric.test(expr)) {
        return expr;
      }

      if (expr === "depth") {
        return atDepth;
      }
      if (expr === "idepth") {
        return 1 / atDepth;
      }

      let alias = expr;
      let getNext = false;

      if (expr.indexOf("()") !== -1) {
        alias = alias.split("()")[0];
        getNext = true;
      }

      // if literal alias, use it
      let seq: Sequence | null = Sequence.sequences[alias];

      if (seq) {
        if (getNext) {
          return seq.next() || 0;
        }
        let n = seq.current();
        if (isNaN(n)) {
          return seq.next() || 0;
        }
        return n;
      }

      // if already defined, use that
      if (expr.indexOf(" as ") !== -1) {
        alias = expr.split(" as ")[1];
        seq = Sequence.sequences[alias];
        if (seq) {
          return seq.next() || 0;
        }
      }

      // otherwise never aliased, find reference
      seq = Sequence.sequences[expr.split(" ").join("_")];
      if (seq) {
        return seq.next() || 0;
      }

      // finally, this must be new
      seq = Sequence.fromStatement(expr);

      if (seq) {
        return seq.next() || 0;
      }
    });
    return +eval(res.join(" "));
  }
}
