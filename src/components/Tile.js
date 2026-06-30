import React from 'react';
import { getTileImage, getTileAsText } from '../scripts/TileConversions';
import { useTranslation } from 'react-i18next';
import { TILE_INDEXES } from '../Constants';

/** Returns the suit-specific modifier class for a tile's corner badge. */
function getIndexSuitClass(index) {
    if (index >= 30) return 'tile-index--honor';
    if (index < 10) return 'tile-index--man';
    if (index < 20) return 'tile-index--pin';
    return 'tile-index--sou';
}

function Tile(props) {
    let { t } = useTranslation();

    let displayTile = props.displayTile != null ? props.displayTile : props.tile;

    let label = TILE_INDEXES[displayTile];
    let showBadge = props.showIndexes && label != null && String(label).trim() !== "";

    return (
        <div className={props.className}>
            <img
                className="tile"
                name={props.tile}
                src={getTileImage(displayTile)}
                title={getTileAsText(t, displayTile)}
                alt={getTileAsText(t, displayTile)}
                onClick={props.onClick}
            />
            {showBadge &&
                <span className={"tile-index " + getIndexSuitClass(displayTile)}>{label}</span>
            }
        </div>
    );
}

export default Tile;
