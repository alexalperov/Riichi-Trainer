import { detectPresentWaitShapes, recordPresentShapeMistake } from './MistakeAnalysis';

function handFromTiles(tiles) {
    let hand = Array(38).fill(0);
    tiles.forEach((tile) => hand[tile]++);
    return hand;
}

function repeated(tile, count) {
    return Array(count).fill(tile);
}

describe('detectPresentWaitShapes', () => {
    test('detects tanki only from actual singleton tiles', () => {
        expect(detectPresentWaitShapes(handFromTiles([31]))).toContain('tanki');
        expect(detectPresentWaitShapes(handFromTiles([31, 31]))).not.toContain('tanki');
    });

    test.each([
        ['aryanmen', [...repeated(3, 2), 4, 5]],
        ['aryanmen mirrored', [3, 4, ...repeated(5, 2)]],
        ['ryantan', [...repeated(3, 3), 4]],
        ['ryantan mirrored', [3, ...repeated(4, 3)]],
        ['kantan', [...repeated(3, 3), 5]],
        ['kantan mirrored', [3, ...repeated(5, 3)]],
        ['pentan', [...repeated(1, 3), 2]],
        ['pentan mirrored', [8, ...repeated(9, 3)]],
        ['nobetan', [3, 4, 5, 6]],
        ['sanmenchan', [2, 3, 4, 5, 6]],
        ['entotsu', [...repeated(3, 3), 4, 5, 7, 7]],
        ['entotsu mirrored', [3, 4, ...repeated(5, 3), 7, 7]],
        ['sanmenNobetan', [2, 3, 4, 5, 6, 7, 8]],
        ['tatsumaki', [...repeated(3, 3), 4, ...repeated(5, 3)]],
        ['happoubijin', [...repeated(2, 3), 3, 4, 5, 6, ...repeated(7, 3)]]
    ])('detects %s', (name, tiles) => {
        let key = name.replace(' mirrored', '');
        expect(detectPresentWaitShapes(handFromTiles(tiles))).toContain(key);
    });

    test('does not call an edge-bound ryantan a ryantan', () => {
        let shapes = detectPresentWaitShapes(handFromTiles([...repeated(1, 3), 2]));
        expect(shapes).toContain('pentan');
        expect(shapes).not.toContain('ryantan');
    });

    test('merges red fives before finding patterns', () => {
        expect(detectPresentWaitShapes(handFromTiles([3, 4, 0, 6]))).toContain('nobetan');
    });
});

describe('recordPresentShapeMistake', () => {
    test('counts each shape once per mistake even when it appears twice', () => {
        let hand = handFromTiles([2, 3, 4, 5, 12, 13, 14, 15]);
        let result = recordPresentShapeMistake({}, hand, 4);

        expect(result.nobetan).toEqual({ count: 1, lost: 4 });
        expect(result.tanki).toEqual({ count: 1, lost: 4 });
    });

    test('accumulates count and acceptance loss', () => {
        let hand = handFromTiles([3, 4, 5, 6]);
        let once = recordPresentShapeMistake({}, hand, 2);
        let twice = recordPresentShapeMistake(once, hand, 5);

        expect(twice.nobetan).toEqual({ count: 2, lost: 7 });
    });
});
