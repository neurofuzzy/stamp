interface ILayout {
  type: string;
  
}

interface IGridLayout extends ILayout {
  type: "grid";
  numX: number;
  numY: number;
  spacingX: number;
  spacingY: number;
}