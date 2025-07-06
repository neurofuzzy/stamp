import { IShapeHandler, IShapeContext, IRectangleParams } from '../stamp-interfaces';

/**
 * Handler for creating rectangle shapes
 */
export class BaseHandler implements IShapeHandler {

  handle(params: IRectangleParams, _: IShapeContext): void {

    // backwards compatibility
    if (!params.layout) {
      params.layout = {
        type: "grid",
        columns: params.numX || 1,
        rows: params.numY || 1,
        columnSpacing: params.spacingX || 0,
        rowSpacing: params.spacingY || 0,
        columnPadding: 0,
        rowPadding: 0,
        offsetAlternateRows: false,
      };
    }

  }

} 