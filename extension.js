const neutrinoFormatExtension = {
    name: "Neutrino",
    extension: "cson",
    write(map, fileName) {
        const { tileWidth, tileHeight } = map
        const customMapData = {
            width: map.width * tileWidth,
            height: map.height * tileHeight,
            collisionRects: [],
            checkpoints: [],
            layers: [],
        }
        Object.assign(customMapData, map.properties())
        const tilesByTileset = map.tilesets.reduce((acc, cur) => {
            acc[cur.name] = cur.tiles
            return acc
        }, {})
        const layers = Array(map.layerCount).fill(0).map((_, i) => i)
        layers.forEach(layerIndex => {
            const layer = map.layerAt(layerIndex)
            if (layer.isObjectLayer && layer.name === "collision") {
                layer.objects.forEach(obj => {
                    const { x, y , width, height, properties } = obj
                    customMapData.collisionRects.push(Object.assign(
                        { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) },
                        properties()
                    ))
                })
                return
            }
            if (layer.isObjectLayer && layer.name === "checkpoints") {
                layer.objects.forEach(({ x, y }) => {
                    customMapData.checkpoints.push({
                        x: Math.round(x),
                        y: Math.round(y)
                    })
                })
                return
            }
            const { width: mapWidth, height: mapHeight } = layer
            const { zIndex=layerIndex, pFx=1, pFy=1, offsetX=0, offsetY=0 } = layer.properties()
            const layerData = {
                name: layer.name,
                zIndex,
                offsetX,
                offsetY,
                pFx,
                pFy,
                tiles: []
            }
            if (layer.isObjectLayer && layer.name === "spawn-points") { // spawn points
                layer.objects.forEach(({ name, x, y, properties }) => {
                    if (!name) { throw new Error("Anonymous spawn-point") }
                    layerData.tiles.push(Object.assign(
                        { name, x: Math.round(x), y: Math.round(y) },
                        properties()
                    ))
                })
                customMapData.layers.push(layerData)
                return
            }
            // map layer
            const tilemap = Array(mapWidth * mapHeight).fill(0).map((_, i) => i)
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
                
                layerData.tiles.push(Object.assign({
                    x: column * tileWidth, 
                    y: (row + 1) * tileHeight - tileImageHeight, // computing the correct y value by taking offsets into account (changing it from y-coordinates of the tile at bottom-left corner of tileImage to the y-coordinates of top left-corner of the image) 
                }, props))
            })
            customMapData.layers.push(layerData)
        })
        customMapData.layers.sort((a, b) => a.zIndex - b.zIndex)
        const outputFilename = fileName.replace(/\..+$/, ".cson") // making sure the output file extension is cson
        const fileContent = JSON.stringify(customMapData)
        const file = new TextFile(outputFilename, TextFile.WriteOnly)
        file.write(fileContent)
        file.commit()
        return undefined
    }
}

tiled.registerMapFormat("Neutrino", neutrinoFormatExtension)