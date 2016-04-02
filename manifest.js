Manifest = {
  albums: [
    {
      name: 'E.R.A.',
      artist: 'Milan Rang',
      src: 'audio/E.R.A/',
      songs: [
        '01 - Milan Rang - Epic Thing (Blood and Steel).mp3',
        '02 - Milan Rang - Stepping trough the forest.mp3',
        '03 - Milan Rang - Sounds of High Skies.mp3',
        '04 - Milan Rang - The Friendly Meadows.mp3',
        '05 - Milan Rang - Shizzleformaticism (Jump Into Adventure).mp3',
        '06 - Milan Rang - The Coast is Clear.mp3',
        '07 - Milan Rang - Whispers on the Wind.mp3',
        '08 - Milan Rang - Shivers and Icy Touches.mp3'
      ]
    },

    {
      name: 'E.R.A. - The Outer Regions',
      artist: 'Derk-Jan Karrenbeld',
      src: 'audio/E.R.A - The Outer Regions/',
      songs: [
        '01 - Derk-Jan Karrenbeld - Battle of the Fastest.mp3',
        '02 - Derk-Jan Karrenbeld - Bongos of Basra.mp3',
        '03 - Derk-Jan Karrenbeld - Feeling the Voltage.mp3',
        '04 - Derk-Jan Karrenbeld - Field of the sun.mp3',
        '05 - Derk-Jan Karrenbeld - Walking in the Fields.mp3'
      ]
    }
  ]
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Manifest;
else
  window.Manifest = Manifest;
