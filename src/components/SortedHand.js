import React from 'react';
import { Row } from 'reactstrap';
import Tile from './Tile';

function SortedHand(props) {
    const tiles = [];

    let hand = props.tiles;

    if (!hand) {
        return <Row />;
    }

    let lastDraw = props.lastDraw;
    let index = 0;

    for (let i = 0; i < hand.length; i++) {
        tiles.push((
            <Tile className="handTile"
                key={index++}
                tile={hand[i]}
                onClick={props.onTileClick}
                showIndexes={props.showIndexes}
            />
        ));
    }

    if (lastDraw > -1) {
        // Key on the draw so the draw-in animation replays on every new tile.
        let drawKey = "draw-" + (props.drawId != null ? props.drawId : lastDraw);
        tiles.push((
            <Tile className="handTile"
                key={drawKey}
                tile={lastDraw}
                onClick={props.onTileClick}
                showIndexes={props.showIndexes}
                isDraw
            />
        ));
    }

    return (
        <Row>
            {tiles}
        </Row>
    );
}

export default SortedHand;