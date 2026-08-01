import React from 'react';
import { useTranslation } from 'react-i18next';
import { PRESENT_WAIT_SHAPES } from '../../scripts/MistakeAnalysis';

/**
 * Counts every requested wait shape that was present when a mistake happened.
 * One mistake may contribute to multiple rows; mirrored forms share a row.
 */
function ShapeMistakeBreakdown(props) {
    let { t } = useTranslation();
    let mistakes = props.mistakes || {};
    let hasAny = PRESENT_WAIT_SHAPES.some((shape) => mistakes[shape] && mistakes[shape].count > 0);

    if (!hasAny) {
        return (
            <div className="mistake-breakdown">
                <div className="mistake-breakdown__title">{t("stats.mistakes.presentTitle")}</div>
                <div className="mistake-breakdown__empty">{t("stats.mistakes.presentEmpty")}</div>
            </div>
        );
    }

    let rows = PRESENT_WAIT_SHAPES.slice().sort((a, b) => {
        let difference = ((mistakes[b] && mistakes[b].count) || 0) - ((mistakes[a] && mistakes[a].count) || 0);
        return difference || PRESENT_WAIT_SHAPES.indexOf(a) - PRESENT_WAIT_SHAPES.indexOf(b);
    });
    let maxCount = Math.max(...rows.map((shape) => (mistakes[shape] && mistakes[shape].count) || 0));

    return (
        <div className="mistake-breakdown">
            <div className="mistake-breakdown__title">{t("stats.mistakes.presentTitle")}</div>
            <div className="mistake-breakdown__hint">{t("stats.mistakes.presentHint")}</div>
            {rows.map((shape) => {
                let entry = mistakes[shape] || { count: 0, lost: 0 };
                let avgLost = entry.count > 0 ? Math.round((entry.lost / entry.count) * 10) / 10 : 0;
                let width = entry.count > 0
                    ? "calc(" + Math.max(0.04, entry.count / maxCount) + " * (100% - 3rem))"
                    : "0";

                return (
                    <div className="mistake-breakdown__row" key={shape}>
                        <div className="mistake-breakdown__label">
                            {t("stats.mistakes.presentNames." + shape)}
                            <span className="shape-mistake-breakdown__formula">
                                {t("stats.mistakes.presentPatterns." + shape)}
                                {" · "}
                                {t("stats.mistakes.presentWaits", { waits: t("stats.mistakes.presentWinning." + shape) })}
                            </span>
                        </div>
                        <div className="mistake-breakdown__bar-track">
                            <span className="mistake-breakdown__bar" style={{ width: width }} />
                            <span className="mistake-breakdown__count">{entry.count}</span>
                        </div>
                        <div className="mistake-breakdown__detail">
                            {entry.count > 0
                                ? t("stats.mistakes.avgLoss", { count: avgLost })
                                : t("stats.mistakes.noMatchingMistakes")}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ShapeMistakeBreakdown;
