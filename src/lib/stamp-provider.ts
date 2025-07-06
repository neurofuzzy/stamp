import { AbstractShape } from "../geom/shapes";
import { Sequence } from "./sequence";
import { Stamp } from "./stamp";

export class StampProvider {
  private static _instances: StampProvider[] = [];
  private _instanceIndex = 0;
  protected _stamps: Stamp[];
  protected _indexSequenceStatement: string | null;
  protected _currentStampIndex = 0;
  protected _currentStamp: Stamp;
  constructor(stamps: Stamp[] = [], indexSequenceStatement: string | null = null) {
    this._stamps = stamps;
    this._currentStamp = stamps[0]?.clone() || new Stamp();
    this._indexSequenceStatement = indexSequenceStatement;
    this._instanceIndex = StampProvider._instances.length;
    StampProvider._instances.push(this);
  }
  public static getInstance(index: number): StampProvider {
    return StampProvider._instances[index];
  }
  public instanceIndex(): number {
    return this._instanceIndex;
  }
  protected next() {
    if (!this._stamps.length) {
      return;
    }
    this._currentStampIndex = this._indexSequenceStatement
      ? Sequence.resolve(this._indexSequenceStatement)
      : this._currentStampIndex + 1;
    const i = this._currentStampIndex % this._stamps.length;
    this._currentStamp = this._stamps[i]?.clone() || new AbstractShape();
  }
  public currentStamp(): Stamp | undefined {
    return this._currentStamp;
  }
  public nextStamp(): Stamp | undefined {
    this.next();
    return this._currentStamp;
  }
}
