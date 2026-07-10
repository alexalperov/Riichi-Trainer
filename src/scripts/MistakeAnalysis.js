import { convertRedFives } from './TileConversions';

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
