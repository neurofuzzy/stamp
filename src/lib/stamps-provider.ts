import { AbstractShape } from "../geom/shapes";
import { Sequence } from "./sequence";
import { Stamp } from "./stamp";

export class StampsProvider {
  private static _instances: StampsProvider[] = [];
  private _instanceIndex = 0;
  protected _stamps: Stamp[];
  protected _indexSequence: Sequence | null;
  protected _currentStampIndex = 0;
  protected _currentStamp: Stamp;
  constructor(stamps: Stamp[] = [], indexSequence: Sequence | null = null) {
    this._stamps = stamps;
    this._currentStamp = stamps[0]?.clone() || new Stamp();
    this._indexSequence = indexSequence;
    this._instanceIndex = StampsProvider._instances.length;
    StampsProvider._instances.push(this);
  }
  public static getInstance(index: number): StampsProvider {
    return StampsProvider._instances[index];
  }
  public instanceIndex(): number {
    return this._instanceIndex;
  }
  protected next() {
    if (!this._stamps.length) {
      return;
    }
    this._currentStampIndex = this._indexSequence
      ? this._indexSequence.next()
      : this._currentStampIndex + 1;
    const i = this._currentStampIndex % this._stamps.length;
    this._currentStamp = this._stamps[i]?.clone() || new AbstractShape();
  }
  public currentStamp(): Stamp {
    return this._currentStamp;
  }
  public nextStamp(): Stamp {
    this.next();
    return this._currentStamp;
  }
}
