import { GridLayoutHandler } from "./layout-grid";
import { IGridLayoutParams, ILayoutHandler, ILayoutParams } from "./layout-interfaces";


export const layoutHandlerFromParams = (params: ILayoutParams): ILayoutHandler => {
  switch (params?.type) {
    case "grid":
    default:
      return new GridLayoutHandler(params as IGridLayoutParams);
  }
}