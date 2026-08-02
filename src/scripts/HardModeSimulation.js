import { ALL_TILES_REMAINING } from '../Constants';
import { calculateDiscardUkeire } from './UkeireCalculator';
import { calculateMinimumShanten } from './ShantenCalculator';
import { convertRedFives } from './TileConversions';

/** Shapes rare enough to make a useful hard-mode interruption. */
export const HARD_MODE_SHAPES = [
    'nobetan',
    'sanmenchan',
    'entotsu',
    'sanmenNobetan',
    'tatsumaki',
    'happoubijin'
];

function shuffled(values, random) {
    let result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
        let swap = Math.floor(random() * (i + 1));
        let value = result[i];
        result[i] = result[swap];
        result[swap] = value;
    }
    return result;
}

function startingTiles() {
    let tiles = ALL_TILES_REMAINING.slice();
    // Use the common one-red-per-suit setup while keeping four total fives.
    for (let suit = 0; suit < 3; suit++) {
        let base = suit * 10;
        tiles[base] = 1;
        tiles[base + 5] = 3;
    }
    return tiles;
}

function buildWall(tiles) {
    let wall = [];
    tiles.forEach((count, tile) => {
        for (let copy = 0; copy < count; copy++) wall.push(tile);
    });
    return wall;
}

function distinctDiscards(hand) {
    let seen = {};
    let result = [];

    for (let tile = 0; tile < hand.length; tile++) {
        if (hand[tile] <= 0) continue;
        let normalized = convertRedFives(tile);
        if (seen[normalized]) continue;
        seen[normalized] = true;
        result.push(normalized);
    }

    return result;
}

/** Returns the physical tile index to remove for a normalized discard. */
export function resolveHardModeDiscard(hand, normalizedTile) {
    if (hand[normalizedTile] > 0) return normalizedTile;
    if (normalizedTile < 30 && normalizedTile % 10 === 5 && hand[normalizedTile - 5] > 0) {
        return normalizedTile - 5;
    }
    return normalizedTile;
}

function patternAt(counts, start, requirements) {
    for (let offset = 0; offset < requirements.length; offset++) {
        if (counts[start + offset] < requirements[offset]) return false;
    }
    return true;
}

function addPatternOccurrences(occurrences, counts, suitBase, shape, requirements, minStart, maxStart) {
    for (let start = minStart; start <= maxStart; start++) {
        if (!patternAt(counts, start, requirements)) continue;
        occurrences.push({
            shape,
            suitBase,
            start,
            end: start + requirements.length - 1,
            relevantTiles: requirements.map((_, offset) => suitBase + start + offset)
        });
    }
}

/** Returns concrete occurrences, including the tiles that make each shape work. */
function createdShapeOccurrences(handCounts) {
    let hand = convertRedFives(handCounts);
    let occurrences = [];

    for (let suit = 0; suit < 3; suit++) {
        let suitBase = suit * 10;
        let counts = Array(10).fill(0);
        for (let rank = 1; rank <= 9; rank++) counts[rank] = hand[suitBase + rank];

        addPatternOccurrences(occurrences, counts, suitBase, 'nobetan', [1, 1, 1, 1], 1, 6);
        addPatternOccurrences(occurrences, counts, suitBase, 'sanmenchan', [1, 1, 1, 1, 1], 2, 4);
        addPatternOccurrences(occurrences, counts, suitBase, 'sanmenNobetan', [1, 1, 1, 1, 1, 1, 1], 1, 3);
        addPatternOccurrences(occurrences, counts, suitBase, 'tatsumaki', [3, 1, 3], 2, 6);
        addPatternOccurrences(occurrences, counts, suitBase, 'happoubijin', [3, 1, 1, 1, 1, 3], 2, 3);

        // Entotsu also depends on a pair outside its five-tile suited core.
        [[3, 1, 1, 1, 6], [1, 1, 3, 2, 7]].forEach((definition) => {
            let requirements = definition.slice(0, 3);
            let minStart = definition[3];
            let maxStart = definition[4];
            for (let start = minStart; start <= maxStart; start++) {
                if (!patternAt(counts, start, requirements)) continue;
                let core = requirements.map((_, offset) => suitBase + start + offset);
                for (let pairTile = 1; pairTile < hand.length; pairTile++) {
                    if (pairTile % 10 === 0 || core.indexOf(pairTile) >= 0 || hand[pairTile] < 2) continue;
                    occurrences.push({
                        shape: 'entotsu',
                        suitBase,
                        start,
                        end: start + 2,
                        relevantTiles: core.concat(pairTile)
                    });
                }
            }
        });
    }

    return occurrences;
}

function discardCreatesOccurrence(tile, occurrence) {
    let normalized = convertRedFives(tile);
    if (occurrence.relevantTiles.indexOf(normalized) >= 0) return true;
    if (normalized >= 30 || Math.floor(normalized / 10) * 10 !== occurrence.suitBase) return false;
    let rank = normalized % 10;
    return rank === occurrence.start - 1 || rank === occurrence.end + 1;
}

function shapesCreatedByDiscard(hand, tile) {
    let result = hand.slice();
    result[resolveHardModeDiscard(result, tile)]--;
    let found = {};

    createdShapeOccurrences(result).forEach((occurrence) => {
        if (discardCreatesOccurrence(tile, occurrence)) found[occurrence.shape] = true;
    });

    return HARD_MODE_SHAPES.filter((shape) => found[shape]);
}

/**
 * Finds shapes formed by making the optimal discard itself. Every equally
 * optimal choice must create a complex result, preventing an unrelated outside
 * cut from qualifying just because it leaves a pre-existing block untouched.
 */
export function findCreatedDecisionShapes(hand, bestTiles) {
    if (!bestTiles.length) return [];
    let createdByBest = bestTiles.map((tile) => shapesCreatedByDiscard(hand, tile));
    if (createdByBest.some((shapes) => shapes.length === 0)) return [];

    let found = {};
    createdByBest.forEach((shapes) => shapes.forEach((shape) => { found[shape] = true; }));
    return HARD_MODE_SHAPES.filter((shape) => found[shape]);
}

/** Creates a natural closed-hand round with a shuffled wall. */
export function createHardModeRound(random = Math.random) {
    let remainingTiles = startingTiles();
    let wall = shuffled(buildWall(remainingTiles), random);
    let hand = Array(38).fill(0);
    let lastDraw = -1;

    for (let i = 0; i < 14; i++) {
        lastDraw = wall.pop();
        hand[lastDraw]++;
        remainingTiles[lastDraw]--;
    }

    return {
        hand,
        remainingTiles,
        wall,
        discards: [],
        lastDraw,
        turn: 1
    };
}

/** Evaluates whether the current 14-tile position is a useful hard puzzle. */
export function analyzeHardModePosition(round) {
    let evaluations = calculateDiscardUkeire(
        round.hand,
        round.remainingTiles,
        calculateMinimumShanten
    );
    let discards = distinctDiscards(round.hand);
    let bestValue = Math.max(...discards.map((tile) => evaluations[tile].value));
    let bestTiles = discards.filter((tile) => evaluations[tile].value === bestValue);
    // Zero-ukeire cuts tend to be visibly destructive rather than instructive.
    let inferiorTiles = discards.filter((tile) => {
        let value = evaluations[tile].value;
        return value > 0 && value < bestValue;
    });
    let shapes = bestValue > 0 ? findCreatedDecisionShapes(round.hand, bestTiles) : [];

    return {
        evaluations,
        bestTiles,
        bestValue,
        shapes,
        shanten: calculateMinimumShanten(round.hand),
        isPuzzle: shapes.length > 0 && inferiorTiles.length > 0
    };
}

/**
 * Advances one optimal discard/draw. The caller replaces completed rounds and
 * batches these small steps over time so searching never monopolizes the UI.
 */
export function advanceHardModeRound(round, analysis, random = Math.random) {
    if (!round.wall.length || !analysis.bestTiles.length) return { round, complete: true };

    let next = {
        hand: round.hand.slice(),
        remainingTiles: round.remainingTiles.slice(),
        wall: round.wall.slice(),
        discards: round.discards.slice(),
        lastDraw: round.lastDraw,
        turn: round.turn
    };
    let normalized = analysis.bestTiles[Math.floor(random() * analysis.bestTiles.length)];
    let discarded = resolveHardModeDiscard(next.hand, normalized);
    next.hand[discarded]--;
    next.discards.push(discarded);

    if (calculateMinimumShanten(next.hand) <= 0 || !next.wall.length) {
        return { round: next, complete: true };
    }

    let draw = next.wall.pop();
    next.hand[draw]++;
    next.remainingTiles[draw]--;
    next.lastDraw = draw;
    next.turn++;

    return { round: next, complete: next.turn > 18 };
}
