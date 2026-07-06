// Vector tile faces from the FluffyStuff riichi-mahjong-tiles set (CC BY 4.0,
// credited in the app footer). These are face art only, with transparent
// backgrounds; the tile body itself is drawn in CSS (see .tile in index.css).
import oneMan from '../tileImages/faces/Man1.svg';
import twoMan from '../tileImages/faces/Man2.svg';
import threeMan from '../tileImages/faces/Man3.svg';
import fourMan from '../tileImages/faces/Man4.svg';
import fiveMan from '../tileImages/faces/Man5.svg';
import redFiveMan from '../tileImages/faces/Man5-Dora.svg';
import sixMan from '../tileImages/faces/Man6.svg';
import sevenMan from '../tileImages/faces/Man7.svg';
import eightMan from '../tileImages/faces/Man8.svg';
import nineMan from '../tileImages/faces/Man9.svg';
import oneSou from '../tileImages/faces/Sou1.svg';
import twoSou from '../tileImages/faces/Sou2.svg';
import threeSou from '../tileImages/faces/Sou3.svg';
import fourSou from '../tileImages/faces/Sou4.svg';
import fiveSou from '../tileImages/faces/Sou5.svg';
import redFiveSou from '../tileImages/faces/Sou5-Dora.svg';
import sixSou from '../tileImages/faces/Sou6.svg';
import sevenSou from '../tileImages/faces/Sou7.svg';
import eightSou from '../tileImages/faces/Sou8.svg';
import nineSou from '../tileImages/faces/Sou9.svg';
import onePin from '../tileImages/faces/Pin1.svg';
import twoPin from '../tileImages/faces/Pin2.svg';
import threePin from '../tileImages/faces/Pin3.svg';
import fourPin from '../tileImages/faces/Pin4.svg';
import fivePin from '../tileImages/faces/Pin5.svg';
import redFivePin from '../tileImages/faces/Pin5-Dora.svg';
import sixPin from '../tileImages/faces/Pin6.svg';
import sevenPin from '../tileImages/faces/Pin7.svg';
import eightPin from '../tileImages/faces/Pin8.svg';
import ninePin from '../tileImages/faces/Pin9.svg';
import east from '../tileImages/faces/Ton.svg';
import south from '../tileImages/faces/Nan.svg';
import west from '../tileImages/faces/Shaa.svg';
import north from '../tileImages/faces/Pei.svg';
import haku from '../tileImages/faces/Haku.svg';
import hatsu from '../tileImages/faces/Hatsu.svg';
import chun from '../tileImages/faces/Chun.svg';
import back from '../tileImages/faces/Back.svg';
import { convertHandToTenhouString } from './HandConversions';
import { SUIT_CHARACTERS, ASCII_TILES } from '../Constants';
import { characterToSuit } from './Utils';

/** Array of png images for each tile. */
const images = [
    redFiveMan, oneMan, twoMan, threeMan, fourMan, fiveMan, sixMan, sevenMan, eightMan, nineMan,
    redFivePin, onePin, twoPin, threePin, fourPin, fivePin, sixPin, sevenPin, eightPin, ninePin,
    redFiveSou, oneSou, twoSou, threeSou, fourSou, fiveSou, sixSou, sevenSou, eightSou, nineSou,
    back, east, south, west, north, haku, hatsu, chun
];

/** Array of localization keys for each number tile value. */
const valueKeys = ["values.redFive", "values.one", "values.two", "values.three", "values.four", "values.five", "values.six", "values.seven", "values.eight", "values.nine"];
/** Array of localization keys for each suit. */
const suitKeys = ["suits.characters", "suits.circles", "suits.bamboo"];
/** Array of localization keys for each honor tile value. */
const honorKeys = ["values.hidden", "values.east", "values.south", "values.west", "values.north", "values.white", "values.green", "values.red"];

/**
 * Gets the png image for the given tile index for use in src tags.
 * @param {TileIndex} index The tile index.
 * @returns {string} Tile image png, for use in src tags.
 */
export function getTileImage(index) {
    return images[index];
}

/**
 * Converts a tile index into that tile's name.
 * @param {Function} t The i18next translation function.
 * @param {TileIndex} index The index of the tile to name.
 * @param {boolean} verbose Whether to give the full name of the tile, or the short representation. Defaults to true.
 * @returns {string} The name of the tile.
 */
export function getTileAsText(t, index, verbose = true) {
    if (index >= 30) {
        return t(honorKeys[index - 30]);
    }

    if (verbose) {
        const value = valueKeys[index % 10];
        const suit = suitKeys[Math.floor(index / 10)];

        return t("shuupai", { value: t(value), suit: t(suit) });
    }
    else {
        const value = index % 10;

        const suit = SUIT_CHARACTERS[Math.floor(index / 10)];

        return `${value}${suit}`;
    }
}

/**
 * Converts red fives to normal fives.
 * @param {TileIndex|TileIndex[]} tiles The tile index to convert, or an array of tile indexes.
 * @returns {TileIndex|TileIndex[]} The converted tile(s).
 */
export function convertRedFives(tiles) {
    if (typeof tiles === 'number') {
        if (tiles % 10 === 0) {
            return tiles + 5;
        }
    }

    if (typeof tiles === 'object' && tiles.length) {
        let result = tiles.slice();

        for (let i = 0; i < 30; i += 10) {
            result[i + 5] += result[i];
            result[i] = 0;
        }

        return result;
    }

    return tiles;
}

/**
 * Converts a tile or array of tiles into their ascii representations.
 * @param {TileIndex|TileIndex[]} tiles The tile index to convert, or an array of tile indexes.
 * @returns {string|string[]} The ascii representation of the tile(s).
 */
export function convertTilesToAsciiSymbols(tiles) {
    if (typeof tiles === 'number') {
        return ASCII_TILES[tiles];
    }

    if (typeof tiles === 'object' && tiles.length) {
        let result = "";

        for (let i = 0; i < tiles.length; i++) {
            result += ASCII_TILES[tiles[i]];
        }

        return result;
    }

    return "";
}

/**
 * Converts a tile or array of tiles into a Tenhou-style string, such as 234m567s.
 * @param {TileIndex|TileIndex[]} indexes The tile index to convert, or an array of tile indexes.
 * @returns {string} The hand string, or "Error." if an invalid parameter was given.
 */
export function convertIndexesToTenhouTiles(indexes) {
    let hand = Array(38).fill(0);

    if (typeof indexes === 'number') {
        hand[indexes] = 1;
    } else if (typeof indexes === 'object' && indexes.length) {
        for (let i = 0; i < indexes.length; i++) {
            hand[indexes[i]] += 1;
        }
    } else {
        return "Error."
    }

    return convertHandToTenhouString(hand);
}

/**
 * Converts Tenhou-style tile indexes (from 0 to 135) to a tile index (0 to 37)
 * @param {number||number[]} tenhouTiles The Tenhou-style tile index to convert, or an array of Tenhou-style tile indexes.
 * @returns {TileIndex|TileIndex[]} The converted tile index(es).
 */
export function convertTenhouTilesToIndex(tenhouTiles) {
    if (typeof tenhouTiles === 'number') {
        return convertTenhouTileToIndex(tenhouTiles);
    }

    if (typeof tenhouTiles === 'object' && tenhouTiles.map) {
        return tenhouTiles.map((tile) => convertTenhouTileToIndex(tile));
    }
}

/**
 * Converts a Tenhou-style tile index (from 0 to 135) to a tile index (0 to 37)
 * @param {number} tenhouTiles The Tenhou-style tile index to convert.
 * @returns {TileIndex} The converted tile index.
 */
function convertTenhouTileToIndex(tenhouTile) {
    let base = Math.floor(tenhouTile / 4);
    let index = tenhouToIndexLookup[base];

    // Check for red fives.
    if (index < 30 && index % 10 === 5) {
        // If the base index divides evenly into 4, it's a red five.
        if (base % 4 === 0) {
            return index - 5;
        }
    }

    return index;
}

/** An array for converting between Tenhou-style tile indexes and our tile indexes. */
const tenhouToIndexLookup = [
     1,  2,  3,  4,  5,  6,  7,  8,  9,
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 23, 24, 25, 26, 27, 28, 29,
    31, 32, 33, 34, 35, 36, 37
];

/**
 * Converts a string representation of a tile into the index.
 * @param {string} tile A string tile, such as 3z
 */
export function convertStringTileToIndex(tile) {
    return parseInt(tile.charAt(0)) + characterToSuit(tile.charAt(1));
}