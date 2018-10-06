const config = require('config')
const zlib = require('zlib')
const Database = require('better-sqlite3')
const VectorTile = require('@mapbox/vector-tile').VectorTile
const Pbf = require('pbf')

const db = Database(config.get('mbtiles'), {readonly: true})

const stmt = db.prepare('SELECT * FROM tiles')
for (const row of stmt.iterate()) {
  let z, x, y, tile
  [z, x, y] = [row.zoom_level, row.tile_column, row.tile_row]
  tile = new VectorTile(new Pbf(zlib.unzipSync(row.tile_data)))
  for (let layerName of Object.keys(tile.layers)) {
    let layer = tile.layers[layerName]
    for (let i = 0; i < layer.length; i++) {
      let f = layer.feature(i).toGeoJSON(x, y, z)
      f.tippecanoe = { layer: layerName }
      for (let key of config.blacklist) {
        delete f.properties[key]
      }
//      console.log(`${f.geometry.type}: ${JSON.stringify(f.properties)}`)
      if (f.properties.source === 'YahooJapan/ALPSMAP') console.log(JSON.stringify(f))
    }
  }
  tile = null
}

db.close
