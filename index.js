"use strict";
exports.__esModule = true;
require("@mapeditor/tiled-api");
var neutrinoFormatExtension = {
    name: "Neutrino",
    extension: "json",
    write: function (map, fileName) {
        var customMap = {
            collisionRects: [],
            tiles: []
        };
        var tileWidth = map.tileWidth, tileHeight = map.tileHeight;
        var tiles = map.tilesets[0].tiles;
        var layers = Array(map.layerCount).fill(0).map(function (_, i) { return i; });
        layers.forEach(function (layerIndex) {
            var layer = map.layerAt(layerIndex);
            if (!!layer.objects) { // collision layer
                layer.objects.forEach(function (obj) {
                    var x = obj.x, y = obj.y, width = obj.width, height = obj.height;
                    customMap.collisionRects.push({ x: x, y: y, width: width, height: height });
                });
                return;
            }
            // map layer
            var width = layer.width, height = layer.height;
            var tilemap = Array(width * height).fill(0).map(function (_, i) { return i; });
            tilemap.forEach(function (i) {
                var row = i % width;
                var column = Math.floor(i / width);
                var tileId = layer.cellAt(row, column).tileId; // destructuring tileId property of the cell
                if (tileId === -1) {
                    return;
                }
                var tileName = tiles[tileId].imageFileName.replace(/^.+\//g, "").replace(/\..+$/, "");
                var tile = {
                    x: row * tileWidth,
                    y: column * tileHeight,
                    tileName: tileName
                };
                customMap.tiles.push(tile);
            });
        });
        var outputFilename = fileName.replace(/\..+$/, ".json");
        var fileContent = JSON.stringify(customMap, null, 4);
        var file = new TextFile(outputFilename, TextFile.WriteOnly);
        file.write(fileContent);
        file.commit();
        return undefined;
    }
};
tiled.registerMapFormat("Neutrino", neutrinoFormatExtension);
