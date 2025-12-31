declare module 'geomagnetism' {
  type ModelPoint = {
    decl?: number;
  };

  type Model = {
    point: (coords: [number, number]) => ModelPoint;
  };

  const geomagnetism: {
    model: (date?: Date) => Model;
  };

  export default geomagnetism;
}
