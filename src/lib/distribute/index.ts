import { GridDistributeHandler } from "./distribute-grid";
import { IGridDistributeParams, IDistributeHandler, IDistributeParams } from "./distribute-interfaces";


export const distributeHandlerFromParams = (params: IDistributeParams): IDistributeHandler => {
  switch (params?.type) {
    case "grid":
    default:
      return new GridDistributeHandler(params as IGridDistributeParams);
  }
}