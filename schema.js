module.exports = {
  data: [
    [
      'japan.mbtiles',
      null,
      {layer: 'osm', minzoom: 12, maxzoom: 12},
      (f) => {
        for (let key of [
          '@id', '@type', '@version', '@changeset', '@uid', '@user', 
          '@timestamp', 'source']) {
          delete f.properties[key]
        }
        return f
      }
    ]
  ] 
}
