import { convertRedFives } from './TileConversions';

/** Stable display/storage order for wait shapes found anywhere in a mistake hand. */
export const PRESENT_WAIT_SHAPES = [
    "tanki",
    "aryanmen",
    "ryantan",
    "kantan",
    "pentan",
    "nobetan",
    "sanmenchan",
    "entotsu",
    "sanmenNobetan",
    "tatsumaki",
    "happoubijin"
];

/** Whether a suited rank pattern exists at a 1-based starting rank. */
function patternAt(suitCounts, start, requirements) {
    for (let offset = 0; offset < requirements.length; offset++) {
        if (suitCounts[start + offset] < requirements[offset]) return false;
    }
    return true;
}

/** Whether a pattern exists within the inclusive range of valid starts. */
function hasPattern(suitCounts, requirements, minStart, maxStart) {
    for (let start = minStart; start <= maxStart; start++) {
        if (patternAt(suitCounts, start, requirements)) return true;
    }
    return false;
}

/** Entotsu needs a separate pair outside its five-tile suited core. */
function hasPairOutside(hand, excludedTiles) {
    for (let tile = 1; tile < hand.length; tile++) {
        if (tile % 10 === 0 || excludedTiles.indexOf(tile) >= 0) continue;
        if (hand[tile] >= 2) return true;
    }
    return false;
}

/** Detects either orientation of entotsu in one suit. */
function hasEntotsu(hand, suitBase, suitCounts) {
    // XXX (X+1) (X+2) + YY; X+3 must remain a valid winning rank.
    for (let start = 1; start <= 6; start++) {
        if (patternAt(suitCounts, start, [3, 1, 1]) &&
            hasPairOutside(hand, [suitBase + start, suitBase + start + 1, suitBase + start + 2])) {
            return true;
        }
    }

    // (X-2) (X-1) XXX + YY; X-3 must remain a valid winning rank.
    for (let start = 2; start <= 7; start++) {
        if (patternAt(suitCounts, start, [1, 1, 3]) &&
            hasPairOutside(hand, [suitBase + start, suitBase + start + 1, suitBase + start + 2])) {
            return true;
        }
    }

    return false;
}

/**
 * Finds every requested wait shape that exists anywhere in a hand.
 * A shape is returned at most once even when it occurs in multiple suits.
 * Red fives are merged into their ordinary five before pattern matching.
 *
 * @param {TileCounts} handCounts The hand before the mistaken discard.
 * @returns {string[]} Shape keys in PRESENT_WAIT_SHAPES order.
 */
export function detectPresentWaitShapes(handCounts) {
    let hand = convertRedFives(handCounts.slice());
    let found = {};

    // A tanki is represented by an actual singleton, not one tile borrowed
    // from a pair/triplet. This keeps the category meaningful.
    for (let tile = 1; tile < hand.length; tile++) {
        if (tile % 10 !== 0 && hand[tile] === 1) {
            found.tanki = true;
            break;
        }
    }

    for (let suit = 0; suit < 3; suit++) {
        let suitBase = suit * 10;
        let counts = Array(10).fill(0);
        for (let rank = 1; rank <= 9; rank++) counts[rank] = hand[suitBase + rank];

        // XX (X+1) (X+2), plus the mirrored form. Starts are limited so
        // every winning rank stated by the shape remains between 1 and 9.
        if (hasPattern(counts, [2, 1, 1], 1, 6) || hasPattern(counts, [1, 1, 2], 2, 7)) {
            found.aryanmen = true;
        }

        if (hasPattern(counts, [3, 1], 2, 7) || hasPattern(counts, [1, 3], 2, 7)) {
            found.ryantan = true;
        }

        if (hasPattern(counts, [3, 0, 1], 1, 7) || hasPattern(counts, [1, 0, 3], 1, 7)) {
            found.kantan = true;
        }

        if (patternAt(counts, 1, [3, 1]) || patternAt(counts, 8, [1, 3])) {
            found.pentan = true;
        }

        if (hasPattern(counts, [1, 1, 1, 1], 1, 6)) found.nobetan = true;
        if (hasPattern(counts, [1, 1, 1, 1, 1], 2, 4)) found.sanmenchan = true;
        if (hasEntotsu(hand, suitBase, counts)) found.entotsu = true;
        if (hasPattern(counts, [1, 1, 1, 1, 1, 1, 1], 1, 3)) found.sanmenNobetan = true;
        if (hasPattern(counts, [3, 1, 3], 2, 6)) found.tatsumaki = true;
        if (hasPattern(counts, [3, 1, 1, 1, 1, 3], 2, 3)) found.happoubijin = true;
    }

    return PRESENT_WAIT_SHAPES.filter((shape) => found[shape]);
}

/**
 * Heuristics for describing what a discarded tile was doing in the hand.
 * Hands are ambiguous (a tile can sit in several interpretations at once),
 * so this picks the strongest role by priority: triplet > completed run >
 * pair > two-tile partial shape > floater. That's enough to answer the
 * training question "what kind of shape do I tend to break?".
 */

/**
 * Classifies the shape a tile occupies within a 14-tile hand.
 * @param {TileCounts} handCounts The hand before the discard.
 * @param {TileIndex} tileIndex The tile being discarded.
 * @returns {string} One of: triplet, completeRun, pair, ryanmen, kanchan, penchan, floater.
 */
export function classifyTileShape(handCounts, tileIndex) {
    let hand = convertRedFives(handCounts.slice());
    let tile = convertRedFives(tileIndex);
    let copies = hand[tile];

    if (tile >= 31) {
        if (copies >= 3) return "triplet";
        if (copies === 2) return "pair";
        return "floater";
    }

    let value = tile % 10;
    let has = (offset) => {
        let neighbor = value + offset;
        return neighbor >= 1 && neighbor <= 9 && hand[tile + offset] > 0;
    };

    if (copies >= 3) return "triplet";
    if ((has(-2) && has(-1)) || (has(-1) && has(1)) || (has(1) && has(2))) return "completeRun";
    if (copies === 2) return "pair";
    if (has(1)) return (value === 1 || value === 8) ? "penchan" : "ryanmen";
    if (has(-1)) return (value === 2 || value === 9) ? "penchan" : "ryanmen";
    if (has(2) || has(-2)) return "kanchan";
    return "floater";
}

/**
 * Classifies the shape broken by a discard, upgrading "pair" to "onlyPair"
 * when it was the hand's only head material (no other pair or triplet).
 * @param {TileCounts} handCounts The hand before the discard.
 * @param {TileIndex} tileIndex The tile that was discarded.
 * @returns {string} A shape key, additionally including: onlyPair.
 */
export function classifyBrokenShape(handCounts, tileIndex) {
    let role = classifyTileShape(handCounts, tileIndex);

    if (role === "pair") {
        let hand = convertRedFives(handCounts.slice());
        let tile = convertRedFives(tileIndex);
        let otherHeads = 0;

        for (let i = 1; i < 38; i++) {
            if (i !== tile && hand[i] >= 2) otherHeads++;
        }

        if (otherHeads === 0) role = "onlyPair";
    }

    return role;
}

/**
 * Records a suboptimal discard into a mistake-stats object.
 * @param {Object} mistakes The aggregate object, mutated copy is returned.
 * @param {TileCounts} handBefore The 14-tile hand before the discard.
 * @param {TileIndex} chosenTile The discarded tile.
 * @param {TileIndex} bestTile The most efficient discard.
 * @param {number} ukeireLost How many tiles of acceptance the choice gave up.
 * @returns {Object} The updated mistakes object.
 */
export function recordMistake(mistakes, handBefore, chosenTile, bestTile, ukeireLost) {
    let broke = classifyBrokenShape(handBefore, chosenTile);
    let better = classifyTileShape(handBefore, bestTile);

    let updated = Object.assign({}, mistakes);
    let entry = updated[broke]
        ? { count: updated[broke].count, lost: updated[broke].lost, best: Object.assign({}, updated[broke].best) }
        : { count: 0, lost: 0, best: {} };

    entry.count += 1;
    entry.lost += ukeireLost;
    entry.best[better] = (entry.best[better] || 0) + 1;
    updated[broke] = entry;

    return updated;
}

/**
 * Records one suboptimal discard against every requested shape present in
 * the pre-discard hand. Multiple occurrences of one shape still add only one
 * count, while a hand containing several different shapes increments each.
 *
 * @param {Object} shapeMistakes Aggregate keyed by PRESENT_WAIT_SHAPES.
 * @param {TileCounts} handBefore The hand before the mistaken discard.
 * @param {number} ukeireLost How much acceptance the mistake cost.
 * @returns {Object} The updated aggregate.
 */
export function recordPresentShapeMistake(shapeMistakes, handBefore, ukeireLost) {
    let updated = Object.assign({}, shapeMistakes);

    detectPresentWaitShapes(handBefore).forEach((shape) => {
        let previous = updated[shape] || { count: 0, lost: 0 };
        updated[shape] = {
            count: previous.count + 1,
            lost: previous.lost + ukeireLost
        };
    });

    return updated;
}
