!function(){
  'use strict';

  var Manifest = {
    albums: [
      {
        name: 'E.R.A.',
        artist: 'Milan Rang',
        src: 'audio/E.R.A/',
        cover: 'audio/E.R.A/cover.png',
        thumb: 'audio/E.R.A/thumb.png',
        color: '#000000',
        songs: [
          {
            track: 1,
            src: '01 - Milan Rang - Epic Thing (Blood and Steel).mp3',
            name: 'Epic Thing (Blood and Steel)',
            artist: 'Milan Rang',
            duration: 132
          },
          {
            track: 2,
            src: '02 - Milan Rang - Stepping through the forest.mp3',
            name: 'Stepping Through the Forest',
            artist: 'Milan Rang',
            duration: 132
          },
          {
            track: 3,
            src: '03 - Milan Rang - Sounds of High Skies.mp3',
            name: 'Sounds of High Skies',
            artist: 'Milan Rang',
            duration: 221
          },
          {
            track: 4,
            src: '04 - Milan Rang - The Friendly Meadows.mp3',
            name: 'The Friendly Meadows',
            artist: 'Milan Rang',
            duration: 156
          },
          {
            track: 5,
            src: '05 - Milan Rang - Shizzleformaticism (Jump Into Adventure).mp3',
            name: 'Shizzleformaticism (Jump Into Adventure)',
            artist: 'Milan Rang',
            duration: 199
          },
          {
            track: 6,
            src: '06 - Milan Rang - The Coast is Clear.mp3',
            name: 'The Coast is Clear',
            artist: 'Milan Rang',
            duration: 117
          },
          {
            track: 7,
            src: '07 - Milan Rang - Whispers on the Wind.mp3',
            name: 'Whispers on the Wind',
            artist: 'Milan Rang',
            duration: 160
          },
          {
            track: 8,
            src: '08 - Milan Rang - Shivers and Icy Touches.mp3',
            name: 'Shivers and Icy Touches',
            artist: 'Milan Rang',
            duration: 248
          },
        ]
      },
      {
        name: 'E.R.A. - The Outer Regions',
        artist: 'Derk-Jan Karrenbeld',
        src: 'audio/E.R.A - The Outer Regions/',
        cover: 'audio/E.R.A - The Outer Regions/cover2.png',
        thumb: 'audio/E.R.A - The Outer Regions/thumb2.png',
        color: '#afa171',
        songs: [
          {
            track: 1,
            src: '01 - Derk-Jan Karrenbeld - Battle of the Fastest.mp3',
            name: 'Battle of the Fastest',
            artist: 'Derk-Jan Karrenbeld',
            duration: 78
          },
          {
            track: 2,
            src: '02 - Derk-Jan Karrenbeld - Bongos of Basra.mp3',
            name: 'Bongos of Basra',
            artist: 'Derk-Jan Karrenbeld',
            duration: 126
          },
          {
            track: 3,
            src: '03 - Derk-Jan Karrenbeld - Feeling the Voltage.mp3',
            name: 'Feeling the Voltage',
            artist: 'Derk-Jan Karrenbeld',
            duration: 61
          },
          {
            track: 4,
            src: '04 - Derk-Jan Karrenbeld - Field of the sun.mp3',
            name: 'Field of the Sun',
            artist: 'Derk-Jan Karrenbeld',
            duration: 156
          },
          {
            track: 5,
            src: '05 - Derk-Jan Karrenbeld - Walking in the Fields.mp3',
            name: 'Walking in the Fields',
            artist: 'Derk-Jan Karrenbeld',
            duration: 96
          }
        ]
      }
    ]
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Manifest;
  else
    window.Manifest = Manifest;
}();
