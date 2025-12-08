import React from 'react';
import { Image } from 'react-native';

const SongPoster = ({ posterUrl, style, resizeMode = 'cover' }) => {
  const getImageSource = () => {
    if (!posterUrl || posterUrl === 'default') {
      return require('../../assets/images/poster.png');
    }
    return { uri: posterUrl };
  };

  return (
    <Image
      source={getImageSource()}
      style={style}
      resizeMode={resizeMode}
    />
  );
};

export default SongPoster;
