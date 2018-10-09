const config = require('config')
const fs = require('fs')
const zlib = require('zlib')
const Database = require('better-sqlite3')
const VectorTile = require('@mapbox/vector-tile').VectorTile
const Pbf = require('pbf')
// const geobuf = require('geobuf')
let schema, Z, X, Y, maxzoom
const qaz = 12 // zoom level of  OSM QA Tiles

if (process.argv.length !== 7) {
  console.log(`usage: node index.js {schema.js} {z} {x} {y} {maxzoom}`)
  process.exit()
} else {
  schema = require(process.argv[2])
  Z = parseInt(process.argv[3]) 
  X = parseInt(process.argv[4]) 
  Y = parseInt(process.argv[5]) 
  maxzoom = parseInt(process.argv[6]) 
}
/*
let fc = {
  type: 'FeatureCollection',
  features: []
}
*/

const yflip = (y, z) => {
  return 2 ** z - y - 1
}

const work = function(mbtiles, properties, tippecanoe, modify) {
  const db = Database(mbtiles, {readonly: true})
  qax = X * (2 ** (qaz - Z))
  qay = Y * (2 ** (qaz - Z))
  sql = `SELECT * FROM tiles WHERE tile_column >= ${qax} AND \
tile_column < ${qax + (2 ** (qaz - Z))} AND \
tile_row < ${yflip(qay, qaz)} AND \
tile_row >= ${yflip(qay + (2 ** (qaz - Z)), qaz)}`
  const stmt = db.prepare(sql)
  for (const row of stmt.iterate()) {
    let z, x, y, tile
    [z, x, y] = [row.zoom_level, row.tile_column, row.tile_row]
    tile = new VectorTile(new Pbf(zlib.unzipSync(row.tile_data)))
    for (let layerName of Object.keys(tile.layers)) {
      let layer = tile.layers[layerName]
      for (let i = 0; i < layer.length; i++) {
        let f = layer.feature(i).toGeoJSON(x, y, z)
        f.tippecanoe = tippecanoe
        if (properties) {
          for (let key of Object.keys(f.properties)) {
            if (properties.indexOf(key) == -1) {
              delete f.properties[key]
            }
          }   
        }
        if (modify) f = modify(f)
// fc.features.push(f)
        console.log(JSON.stringify(f))
      }
    }
    tile = null
  }
  db.close
}

for (const s of schema.data) {
  work(s[0], s[1], s[2], s[3])
}

// fs.writeFileSync(geobuf.encode(fc, new Pbf()))

