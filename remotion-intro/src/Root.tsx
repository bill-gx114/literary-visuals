import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';

export const Root: React.FC = () => <Composition
  id="LiteraryVisuals" component={Film}
  durationInFrames={1536} fps={24} width={1920} height={1080}
/>;
