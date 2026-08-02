import {
    HARD_MODE_SHAPES,
    advanceHardModeRound,
    analyzeHardModePosition,
    createHardModeRound,
    findDecisionShapes,
    resolveHardModeDiscard
} from './HardModeSimulation';

function handFromTiles(tiles) {
    let hand = Array(38).fill(0);
    tiles.forEach((tile) => hand[tile]++);
    return hand;
}

describe('hard mode simulation', () => {
    test('deals fourteen tiles from a complete riichi wall', () => {
        let round = createHardModeRound(() => 0.42);

        expect(round.hand.reduce((total, count) => total + count, 0)).toBe(14);
        expect(round.wall).toHaveLength(122);
        expect(round.remainingTiles.reduce((total, count) => total + count, 0)).toBe(122);
        expect(round.hand[0] + round.remainingTiles[0]).toBe(1);
        expect(round.hand[5] + round.remainingTiles[5]).toBe(3);
        expect(round.turn).toBe(1);
    });

    test('only reports a complex shape when optimal cuts preserve it and an alternative breaks it', () => {
        let hand = handFromTiles([
            3, 4, 5, 6,
            11, 12, 13,
            21, 22, 23,
            31, 31, 31,
            37
        ]);

        expect(findDecisionShapes(hand, [37], [3])).toContain('nobetan');
        expect(findDecisionShapes(hand, [3], [37])).not.toContain('nobetan');
    });

    test('uses only deliberately selected advanced shapes', () => {
        expect(HARD_MODE_SHAPES).toEqual(expect.arrayContaining([
            'nobetan', 'sanmenchan', 'entotsu', 'tatsumaki', 'happoubijin'
        ]));
        expect(HARD_MODE_SHAPES).not.toContain('tanki');
    });

    test('can map a normalized five back to a physical red five', () => {
        let hand = handFromTiles([0, 1, 2]);
        expect(resolveHardModeDiscard(hand, 5)).toBe(0);
    });

    test('finds a meaningful puzzle by autoplaying naturally dealt hands', () => {
        let seed = 123456789;
        let random = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
        let round = createHardModeRound(random);
        let found = null;

        for (let handNumber = 0; handNumber < 60 && !found; handNumber++) {
            for (let turn = 0; turn < 18; turn++) {
                let analysis = analyzeHardModePosition(round);
                if (analysis.isPuzzle) {
                    found = analysis;
                    break;
                }

                let advanced = advanceHardModeRound(round, analysis, random);
                if (advanced.complete) break;
                round = advanced.round;
            }

            if (!found) round = createHardModeRound(random);
        }

        expect(found).not.toBeNull();
        expect(found.shapes.length).toBeGreaterThan(0);
    });
});
