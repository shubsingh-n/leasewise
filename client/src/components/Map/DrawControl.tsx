import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl/mapbox';
import type { ControlPosition } from 'react-map-gl/mapbox';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

type DrawControlProps = {
  position?: ControlPosition;
  onCreate?: (evt: any) => void;
  onUpdate?: (evt: any) => void;
  onDelete?: (evt: any) => void;
};

export default function DrawControl(props: DrawControlProps) {
  useControl<MapboxDraw>(
    () => new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select'
    }),
    ({ map }) => {
      map.on('draw.create', props.onCreate!);
      map.on('draw.update', props.onUpdate!);
      map.on('draw.delete', props.onDelete!);
    },
    ({ map }) => {
      map.off('draw.create', props.onCreate!);
      map.off('draw.update', props.onUpdate!);
      map.off('draw.delete', props.onDelete!);
    },
    {
      position: props.position
    }
  );

  return null;
}
