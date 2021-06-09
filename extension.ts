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
            tiles: []
        }
        const tiles = map.tilesets[0].tiles
        const layers = Array(map.layerCount).fill(0).map((_, i) => i)
        layers.forEach(layerIndex => {
            const layer = map.layerAt(layerIndex)
            if (layer.isObjectLayer) { // collision layer
                layer.objects.forEach(obj => {
                    const { x, y , width, height } = obj
                    customMap.collisionRects.push({ x, y, width, height })
                })
                return
            }
            // map layer
            const { width: mapWidth, height: mapHeight } = layer
            const tilemap = Array(mapWidth * mapHeight).fill(0).map((_, i) => i)
            tilemap.forEach(i => {
                const column = i % mapWidth
                const row = Math.floor(i / mapWidth)
                const { tileId } = layer.cellAt(column, row) // destructuring tileId property of the cell
                if (tileId === -1) { return } // in case of empty tile
                const { imageFileName, height: tileImageHeight, properties } = tiles[tileId] 
                const { name: tileName }= properties()
                const altTileName = imageFileName.replace(/^.+\//g, "").replace(/\..+$/, "") // just filename without extension
                const tile = {
                    x: column * tileWidth, 
                    y: (row + 1) * tileHeight - tileImageHeight, // computing the correct y value by taking offsets into account (changing it from y-coordinates of the tile at bottom-left corner of tileImage to the y-coordinates of top left-corner of the image) 
                    name: tileName || altTileName
                }
                customMap.tiles.push(tile)
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