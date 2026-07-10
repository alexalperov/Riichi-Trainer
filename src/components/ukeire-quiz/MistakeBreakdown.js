import React from 'react';
import { useTranslation } from 'react-i18next';

/** Display order when counts tie: most instructive categories first. */
const SHAPE_ORDER = ["onlyPair", "pair", "ryanmen", "kanchan", "penchan", "completeRun", "triplet", "floater"];

/**
 * A breakdown of suboptimal discards by the shape they broke, with how much
 * acceptance each habit costs and what the better cut usually was.
 * Rendered as a compact single-hue bar list inside the stats card.
 */
function MistakeBreakdown(props) {
    let { t } = useTranslation();
    let mistakes = props.mistakes || {};

    let rows = Object.keys(mistakes)
        .filter((key) => mistakes[key] && mistakes[key].count > 0)
        .sort((a, b) =>
            (mistakes[b].count - mistakes[a].count) ||
            (SHAPE_ORDER.indexOf(a) - SHAPE_ORDER.indexOf(b))
        );

    if (rows.length === 0) {
        return (
            <div className="mistake-breakdown">
                <div className="mistake-breakdown__title">{t("stats.mistakes.title")}</div>
                <div className="mistake-breakdown__empty">{t("stats.mistakes.empty")}</div>
            </div>
        );
    }

    let maxCount = Math.max(...rows.map((key) => mistakes[key].count));

    return (
        <div className="mistake-breakdown">
            <div className="mistake-breakdown__title">{t("stats.mistakes.title")}</div>
            <div className="mistake-breakdown__hint">{t("stats.mistakes.hint")}</div>
            {rows.map((key) => {
                let entry = mistakes[key];
                let avgLost = Math.round((entry.lost / entry.count) * 10) / 10;

                // The most common shape the best discard occupied instead.
                let bestShapes = Object.keys(entry.best || {});
                let usualBest = bestShapes.length > 0
                    ? bestShapes.sort((a, b) => entry.best[b] - entry.best[a])[0]
                    : null;

                return (
                    <div className="mistake-breakdown__row" key={key}>
                        <div className="mistake-breakdown__label">
                            {t("stats.mistakes.broke." + key)}
                        </div>
                        <div className="mistake-breakdown__bar-track">
                            <span
                                className="mistake-breakdown__bar"
                                style={{ width: "calc(" + Math.max(0.04, entry.count / maxCount) + " * (100% - 3rem))" }}
                            />
                            <span className="mistake-breakdown__count">{entry.count}</span>
                        </div>
                        <div className="mistake-breakdown__detail">
                            {t("stats.mistakes.avgLoss", { count: avgLost })}
                            {usualBest ? " · " + t("stats.mistakes.betterCut", { shape: t("stats.mistakes.shapes." + usualBest) }) : ""}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default MistakeBreakdown;
