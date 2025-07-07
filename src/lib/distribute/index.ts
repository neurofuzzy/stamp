import { GridDistributeHandler } from "./distribute-grid";
import { 
  PhyllotaxisDistributeHandler,
  HexagonalDistributeHandler,
  TriangularDistributeHandler,
  AttractorDistributeHandler,
  PoincareDistributeHandler,
  PoissonDiskDistributeHandler
} from "./distribute-advanced";
import { 
  IGridDistributeParams,
  IDistributeHandler, 
  IDistributeParams,
  IPhyllotaxisDistributeParams,
  IHexagonalDistributeParams,
  ITriangularDistributeParams,
  IAttractorDistributeParams,
  IPoincareDistributeParams,
  IPoissonDiskDistributeParams
} from "./distribute-interfaces";

export { GridDistributeHandler } from "./distribute-grid";
export { 
  PhyllotaxisDistributeHandler,
  HexagonalDistributeHandler,
  TriangularDistributeHandler,
  AttractorDistributeHandler,
  PoincareDistributeHandler,
  PoissonDiskDistributeHandler
} from "./distribute-advanced";

export type { 
  IDistributeHandler,
  IGridDistributeParams,
  IPhyllotaxisDistributeParams,
  IHexagonalDistributeParams,
  ITriangularDistributeParams,
  IAttractorDistributeParams,
  IPoincareDistributeParams,
  IPoissonDiskDistributeParams
} from "./distribute-interfaces";

export const distributeHandlerFromParams = (params: IDistributeParams): IDistributeHandler => {
  switch (params?.type) {
    case "grid":
      return new GridDistributeHandler(params as IGridDistributeParams);
    case "phyllotaxis":
      return new PhyllotaxisDistributeHandler(params as IPhyllotaxisDistributeParams);
    case "hexagonal":
      return new HexagonalDistributeHandler(params as IHexagonalDistributeParams);
    case "triangular":
      return new TriangularDistributeHandler(params as ITriangularDistributeParams);
    case "attractor":
      return new AttractorDistributeHandler(params as IAttractorDistributeParams);
    case "poincare":
      return new PoincareDistributeHandler(params as IPoincareDistributeParams);
    case "poisson-disk":
      return new PoissonDiskDistributeHandler(params as IPoissonDiskDistributeParams);
    default:
      return new GridDistributeHandler(params as IGridDistributeParams);
  }
}