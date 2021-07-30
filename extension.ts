import "@mapeditor/tiled-api"

const neutrinoFormatExtension = {
    name: "Neutrino",
    extension: "cson",
    write(map, fileName) {
        const { tileWidth, tileHeight } = map
        const customMap = {
            width: map.width * tileWidth,
            height: map.height * tileHeight,
            collisionRects: [],
            spawnPoints: [],
            markerPoints: [],
            tiles: [],
            fgTiles: [],
            bgTiles: [], // bg tiles
            fbgTiles: [] // far bg tiles
        }
        // const tiles = map.tilesets[0].tiles
        const tilesByTileset = map.tilesets.reduce((acc, cur) => {
            acc[cur.name] = cur.tiles
            return acc
        }, {})
        const layers = Array(map.layerCount).fill(0).map((_, i) => i)
        layers.forEach(layerIndex => {
            const layer = map.layerAt(layerIndex)
            if (layer.isObjectLayer) {
                switch(layer.name) {
                    case "collision":  // collision layer
                        layer.objects.forEach(obj => {
                            const { x, y , width, height, properties } = obj
                            customMap.collisionRects.push(Object.assign(
                                { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) },
                                properties()
                            ))
                        })
                    break
                    case "spawn-points": // spawn points layer
                        layer.objects.forEach(({ name, x, y, properties }) => {
                            if (!name) { throw new Error("Anonymous spawn-point")}
                            customMap.spawnPoints.push(Object.assign(
                                { name, x: Math.round(x), y: Math.round(y) },
                                properties()
                            ))
                        })
                    break
                    case "marker-points":
                        // marker points
                    break
                }
                return
            }
            // map layer
            const { width: mapWidth, height: mapHeight } = layer
            const tilemap = Array(mapWidth * mapHeight).fill(0).map((_, i) => i)
            const tilesArray = (layer.name === "foreground" && customMap.fgTiles) || 
                                (layer.name === "background" && customMap.bgTiles) ||    
                                (layer.name === "far-background" && customMap.fbgTiles) ||    
                                customMap.tiles
            tilemap.forEach(i => {
                const column = i % mapWidth
                const row = Math.floor(i / mapWidth)
                const { tileId } = layer.cellAt(column, row) // destructuring tileId property of the cell
                if (tileId === -1) { return } // in case of empty tile
                const tilesetName = layer.tileAt(column, row).tileset.name
                const tile = tilesByTileset[tilesetName][tileId]
                if (!tile) { return }
                const { imageFileName, height: tileImageHeight, properties } = tile
                // const { name: tileName, ...rest } = properties() // would've done this but (object rest operator) isn't supported by tiled
                const props = properties()
                const altTileName = imageFileName.replace(/^.+\//g, "").replace(/\..+$/, "") // just filename without extension
                props.name = props.name || altTileName
                
                tilesArray.push(Object.assign({
                    x: column * tileWidth, 
                    y: (row + 1) * tileHeight - tileImageHeight, // computing the correct y value by taking offsets into account (changing it from y-coordinates of the tile at bottom-left corner of tileImage to the y-coordinates of top left-corner of the image) 
                }, props))
            })
        })
        const outputFilename = fileName.replace(/\..+$/, ".cson") // making sure the output file extension is cson
        const fileContent = JSON.stringify(customMap, null, 3)
        const file = new TextFile(outputFilename, TextFile.WriteOnly)
        file.write(fileContent)
        file.commit()
        return undefined
    }
}

tiled.registerMapFormat("Neutrino", neutrinoFormatExtension)