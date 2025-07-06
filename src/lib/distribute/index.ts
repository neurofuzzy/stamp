import { GridDistributeHandler, GridDistributeHandler2 } from "./distribute-grid";
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
  IGrid2DistributeParams,
  IDistributeHandler, 
  IDistributeParams,
  IPhyllotaxisDistributeParams,
  IHexagonalDistributeParams,
  ITriangularDistributeParams,
  IAttractorDistributeParams,
  IPoincareDistributeParams,
  IPoissonDiskDistributeParams
} from "./distribute-interfaces";

export { GridDistributeHandler, GridDistributeHandler2 } from "./distribute-grid";
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
  IGrid2DistributeParams,
  IPhyllotaxisDistributeParams,
  IHexagonalDistributeParams,
  ITriangularDistributeParams,
  IAttractorDistributeParams,
  IPoincareDistributeParams,
  IPoissonDiskDistributeParams
} from "./distribute-interfaces";

export const distributeHandlerFromParams = (params: IDistributeParams): IDistributeHandler => {
  switch (params?.type) {
    case "grid3":
      return new GridDistributeHandler(params as IGridDistributeParams);
    case "grid":
      return new GridDistributeHandler2(params as IGrid2DistributeParams);
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