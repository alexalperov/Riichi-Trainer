import { ALL_TILES_REMAINING } from '../Constants';
import { calculateDiscardUkeire } from './UkeireCalculator';
import { calculateMinimumShanten } from './ShantenCalculator';
import { convertRedFives } from './TileConversions';
import { detectPresentWaitShapes } from './MistakeAnalysis';

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

function shapesAfterDiscard(hand, tile) {
    let result = hand.slice();
    result[resolveHardModeDiscard(result, tile)]--;
    return detectPresentWaitShapes(result);
}

/**
 * Keeps only shapes that every optimal discard preserves and at least one
 * plausible inferior discard breaks. This avoids stopping merely because a
 * pattern happens to exist in an unrelated corner of the hand.
 */
export function findDecisionShapes(hand, bestTiles, inferiorTiles) {
    let present = detectPresentWaitShapes(hand).filter((shape) => HARD_MODE_SHAPES.indexOf(shape) >= 0);

    return present.filter((shape) => {
        let everyBestPreserves = bestTiles.every((tile) => shapesAfterDiscard(hand, tile).indexOf(shape) >= 0);
        let anInferiorBreaks = inferiorTiles.some((tile) => shapesAfterDiscard(hand, tile).indexOf(shape) < 0);
        return everyBestPreserves && anInferiorBreaks;
    });
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
    let shapes = bestValue > 0 ? findDecisionShapes(round.hand, bestTiles, inferiorTiles) : [];

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
