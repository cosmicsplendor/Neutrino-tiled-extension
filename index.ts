import "@mapeditor/tiled-api"

const neutrinoFormatExtension = {
    name: "Neutrino",
    extension: "json",
    write(map, fileName) {
        const customMap = {
            collisionRects: [],
            tiles: []
        }
        const { tileWidth, tileHeight } = map
        const tiles = map.tilesets[0].tiles
        const layers = Array(map.layerCount).fill(0).map((_, i) => i)
        layers.forEach(layerIndex => {
            const layer = map.layerAt(layerIndex)
            if (!!layer.objects) { // collision layer
                layer.objects.forEach(obj => {
                    const { x, y , width, height } = obj
                    customMap.collisionRects.push({ x, y, width, height })
                })
                return
            }
            // map layer
            const { width, height } = layer
            const tilemap = Array(width * height).fill(0).map((_, i) => i)
            tilemap.forEach(i => {
                const row = i % width
                const column = Math.floor(i / width)
                const { tileId } = layer.cellAt(row, column) // destructuring tileId property of the cell
                if (tileId === -1) { return }
                const tileName = tiles[tileId].imageFileName.replace(/^.+\//g, "").replace(/\..+$/, "")
                const tile = {
                    x: row * tileWidth,
                    y: column * tileHeight,
                    tileName
                }
                customMap.tiles.push(tile)
            })
        })
        const outputFilename = fileName.replace(/\..+$/, ".json")
        const fileContent = JSON.stringify(customMap, null, 4)
        const file = new TextFile(outputFilename, TextFile.WriteOnly)
        file.write(fileContent)
        file.commit()
        return undefined
    }
}

tiled.registerMapFormat("Neutrino", neutrinoFormatExtension)