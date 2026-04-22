declare module '@mapbox/mapbox-gl-draw' {
  import { IControl } from 'mapbox-gl';

  export default class MapboxDraw implements IControl {
    constructor(options?: any);
    onAdd(map: any): HTMLElement;
    onRemove(map: any): void;
    add(geojson: any): string[];
    get(featureId: string): any;
    getAll(): any;
    delete(featureIds: string | string[]): this;
    deleteAll(): this;
    changeMode(mode: string, options?: any): this;
    trash(): this;
  }
}
