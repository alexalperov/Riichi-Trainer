import React from 'react';
import { getTileImage, getTileAsText } from '../scripts/TileConversions';
import { useTranslation } from 'react-i18next';
import { TILE_INDEXES } from '../Constants';

/** Returns the suit-specific modifier class for a tile's corner badge. */
function getIndexSuitClass(index) {
    // Red fives (indexes 0/10/20) are notated "0" elsewhere; flag them distinctly.
    if (index < 30 && index % 10 === 0) return 'tile-index--red';
    if (index >= 30) return 'tile-index--honor';
    if (index < 10) return 'tile-index--man';
    if (index < 20) return 'tile-index--pin';
    return 'tile-index--sou';
}

/** Returns visual modifiers that depend on the actual face asset. */
function getTileFaceClass(index) {
    if (index === 30) return ' tile--back';
    if (index < 30 && index % 10 === 0) return ' tile--red-five';
    if (index >= 31) return ' tile--honor';
    return '';
}

function Tile(props) {
    let { t } = useTranslation();

    let displayTile = props.displayTile != null ? props.displayTile : props.tile;

    let label = TILE_INDEXES[displayTile];
    let showBadge = props.showIndexes && label != null && String(label).trim() !== "";
    let bodyClass = "tile" + getTileFaceClass(displayTile);
    let wrapperClass = props.className + (props.isDraw ? " handTile--draw" : "");

    return (
        <div className={wrapperClass}>
            <div className={bodyClass}>
                {/* The img is the click target: existing handlers read event.target.name. */}
                <img
                    className="tile-face"
                    name={props.tile}
                    src={getTileImage(displayTile)}
                    title={getTileAsText(t, displayTile)}
                    alt={getTileAsText(t, displayTile)}
                    onClick={props.onClick}
                    draggable={false}
                />
            </div>
            {showBadge &&
                <span className={"tile-index " + getIndexSuitClass(displayTile)}>{label}</span>
            }
        </div>
    );
}

export default Tile;
