import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const WIDTH = 640;
const HEIGHT = 210;
const PAD = { top: 16, right: 20, bottom: 24, left: 40 };
const WINDOW_SIZE = 60;

/** Formats a timestamp as a short local date, e.g. "Jul 10". */
function shortDate(timestamp) {
    try {
        return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

/**
 * A line chart of hand efficiency (achieved/possible ukeire, in %) for the
 * most recent completed hands. Plain inline SVG, no dependencies. Hovering
 * snaps a crosshair to the nearest hand and shows its details; the same data
 * is available without hovering through the collapsible table underneath.
 */
function StatsChart(props) {
    let { t } = useTranslation();
    let [hoverIndex, setHoverIndex] = useState(null);

    let all = (props.history || []).filter((entry) => entry && entry.p > 0);

    if (all.length < 2) {
        return (
            <div className="stats-chart stats-chart--empty">
                {t("stats.chartEmpty")}
            </div>
        );
    }

    let windowStart = Math.max(0, all.length - WINDOW_SIZE);
    let records = all.slice(windowStart);
    let values = records.map((entry) => Math.round((entry.a / entry.p) * 1000) / 10);

    // Y domain: clean 10s, zoomed to the data but never past 0–100.
    let minValue = Math.min(...values);
    let yMin = Math.max(0, Math.min(90, Math.floor((minValue - 5) / 10) * 10));
    let yMax = 100;
    let tickStep = (yMax - yMin) > 40 ? 20 : 10;
    let ticks = [];
    for (let tick = yMin; tick <= yMax; tick += tickStep) ticks.push(tick);

    let plotWidth = WIDTH - PAD.left - PAD.right;
    let plotHeight = HEIGHT - PAD.top - PAD.bottom;
    let xAt = (i) => PAD.left + (records.length === 1 ? plotWidth / 2 : (i / (records.length - 1)) * plotWidth);
    let yAt = (value) => PAD.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;

    let path = values.map((value, i) => (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(value).toFixed(1)).join(" ");

    let lastIndex = records.length - 1;
    let hovered = hoverIndex != null ? Math.max(0, Math.min(lastIndex, hoverIndex)) : null;

    let onPointerMove = (event) => {
        let rect = event.currentTarget.getBoundingClientRect();
        let x = ((event.clientX - rect.left) / rect.width) * WIDTH;
        let i = Math.round(((x - PAD.left) / plotWidth) * (records.length - 1));
        setHoverIndex(Math.max(0, Math.min(lastIndex, i)));
    };

    let tooltip = null;
    if (hovered != null) {
        let record = records[hovered];
        let leftPercent = (xAt(hovered) / WIDTH) * 100;
        tooltip = (
            <div
                className={"stats-chart__tooltip" + (leftPercent > 55 ? " stats-chart__tooltip--flip" : "")}
                style={{ left: leftPercent + "%" }}
            >
                <div className="stats-chart__tooltip-value">{values[hovered]}%</div>
                <div>{t("stats.chartTooltipHand", { number: windowStart + hovered + 1, date: shortDate(record.t) })}</div>
                <div>{t("stats.chartTooltipDetail", { achieved: record.a, possible: record.p, optimal: record.o, discards: record.d })}</div>
            </div>
        );
    }

    return (
        <div className="stats-chart">
            <div className="stats-chart__title">{t("stats.chartTitle")}</div>
            <div className="stats-chart__plot">
                <svg
                    viewBox={"0 0 " + WIDTH + " " + HEIGHT}
                    role="img"
                    aria-label={t("stats.chartTitle")}
                    onPointerMove={onPointerMove}
                    onPointerLeave={() => setHoverIndex(null)}
                >
                    {/* Hairline gridlines with tick labels */}
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line
                                x1={PAD.left} x2={WIDTH - PAD.right}
                                y1={yAt(tick)} y2={yAt(tick)}
                                className="stats-chart__grid"
                            />
                            <text x={PAD.left - 7} y={yAt(tick) + 3.5} className="stats-chart__tick" textAnchor="end">
                                {tick}%
                            </text>
                        </g>
                    ))}

                    {/* First and last dates carry the time axis */}
                    <text x={PAD.left} y={HEIGHT - 7} className="stats-chart__tick" textAnchor="start">
                        {shortDate(records[0].t)}
                    </text>
                    <text x={WIDTH - PAD.right} y={HEIGHT - 7} className="stats-chart__tick" textAnchor="end">
                        {shortDate(records[lastIndex].t)}
                    </text>

                    {/* Crosshair for the hovered hand */}
                    {hovered != null &&
                        <line
                            x1={xAt(hovered)} x2={xAt(hovered)}
                            y1={PAD.top} y2={HEIGHT - PAD.bottom}
                            className="stats-chart__crosshair"
                        />
                    }

                    <path d={path} className="stats-chart__line" />

                    {hovered != null && hovered !== lastIndex &&
                        <circle cx={xAt(hovered)} cy={yAt(values[hovered])} r="4.5" className="stats-chart__dot" />
                    }

                    {/* Latest hand: end dot + direct label */}
                    <circle cx={xAt(lastIndex)} cy={yAt(values[lastIndex])} r="4.5" className="stats-chart__dot" />
                    <text
                        x={xAt(lastIndex) - 8}
                        y={yAt(values[lastIndex]) - 9}
                        className="stats-chart__end-label"
                        textAnchor="end"
                    >
                        {values[lastIndex]}%
                    </text>
                </svg>
                {tooltip}
            </div>

            <details className="stats-chart__table">
                <summary>{t("stats.chartTableLabel")}</summary>
                <table>
                    <thead>
                        <tr>
                            <th>{t("stats.chartTableHand")}</th>
                            <th>{t("stats.chartTableDate")}</th>
                            <th>{t("stats.chartTableEfficiency")}</th>
                            <th>{t("stats.chartTableOptimal")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, i) => (
                            <tr key={record.t + "-" + i}>
                                <td>{windowStart + i + 1}</td>
                                <td>{shortDate(record.t)}</td>
                                <td>{Math.round((record.a / record.p) * 1000) / 10}%</td>
                                <td>{record.o}/{record.d}</td>
                            </tr>
                        )).reverse()}
                    </tbody>
                </table>
            </details>
        </div>
    );
}

export default StatsChart;
