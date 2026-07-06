import React from 'react';
import { useTranslation } from 'react-i18next';
import { getTileAsText } from '../../scripts/TileConversions';

/**
 * Instant feedback shown under the hand in the efficiency trainer.
 * Grades the latest discard (optimal / okay / went backwards), tracks the
 * current optimal-discard streak, and shows a running efficiency bar for
 * the hand. Celebrates when the hand reaches tenpai.
 */
function DiscardFeedback(props) {
    let { t } = useTranslation();
    let latest = props.latest;

    let percent = props.possible > 0 ? Math.round((props.achieved / props.possible) * 100) : 0;

    // Before the first discard of a hand, show the instructions in place of a verdict.
    if (!latest) {
        return (
            <div className="feedback-panel">
                <div className="feedback-verdict feedback-verdict--hint">
                    <span className="feedback-icon" aria-hidden="true">👉</span>
                    <span className="feedback-title">{t("trainer.instructions")}</span>
                </div>
            </div>
        );
    }

    let isBad = latest.chosenUkeire.value <= 0 && latest.shanten > 0;
    let isOptimal = !isBad && latest.chosenUkeire.value === latest.bestUkeire.value;

    let verdictClass = "feedback-verdict--good";
    let icon = "🔶";
    let title = t("trainer.feedback.suboptimal", { count: latest.chosenUkeire.value });
    let subtitle = props.spoilers
        ? t("trainer.feedback.bestWasSpoiler", { tile: getTileAsText(t, latest.bestTile, props.verbose), count: latest.bestUkeire.value })
        : t("trainer.feedback.bestWas", { count: latest.bestUkeire.value });

    if (isOptimal) {
        verdictClass = "feedback-verdict--optimal";
        icon = "✅";
        title = t("trainer.feedback.optimal");
        subtitle = t("trainer.feedback.acceptance", { count: latest.chosenUkeire.value });

        // Ready shape whose winning tiles are all in hand: not actually tenpai.
        if (latest.shanten <= 0 && latest.handUkeire && latest.handUkeire.value === 0) {
            verdictClass = "feedback-verdict--good";
            icon = "🔶";
            title = t("trainer.feedback.notenTitle");
            subtitle = t("trainer.feedback.noten");
        }
    } else if (isBad) {
        verdictClass = "feedback-verdict--bad";
        icon = "❌";
        title = t("trainer.feedback.shantenUp");
        subtitle = props.spoilers
            ? t("trainer.feedback.bestWasSpoiler", { tile: getTileAsText(t, latest.bestTile, props.verbose), count: latest.bestUkeire.value })
            : t("trainer.feedback.bestWas", { count: latest.bestUkeire.value });
    }

    if (props.isComplete) {
        verdictClass = "feedback-verdict--complete";
        icon = "🎉";
        title = t("trainer.feedback.complete");
        subtitle = t("trainer.feedback.completeSub", { percent: props.possible > 0 ? Math.floor((props.achieved / props.possible) * 1000) / 10 : 0 });
    }

    let showFuriten = !props.isComplete && latest.isFuriten && latest.isFuriten();

    return (
        <div className={"feedback-panel" + (props.isComplete ? " feedback-panel--complete" : "")}>
            {/* Key on the turn number so the pop-in animation replays every discard. */}
            <div className={"feedback-verdict " + verdictClass} key={"turn-" + props.turn}>
                <span className="feedback-icon" aria-hidden="true">{icon}</span>
                <span className="feedback-text">
                    <span className="feedback-title">{title}</span>
                    <span className="feedback-subtitle">
                        {subtitle}
                        {showFuriten ? " " + t("trainer.feedback.furiten") : ""}
                    </span>
                </span>
                {props.streak >= 2 &&
                    <span
                        className="feedback-streak"
                        role="img"
                        title={t("trainer.feedback.streak", { count: props.streak })}
                        aria-label={t("trainer.feedback.streak", { count: props.streak })}
                    >
                        🔥 ×{props.streak}
                    </span>
                }
            </div>
            <div className="feedback-meter" role="img" aria-label={t("trainer.feedback.efficiencyLabel") + ": " + percent + "%"}>
                <span className="feedback-meter__label">{t("trainer.feedback.efficiencyLabel")}</span>
                <span className="feedback-meter__track">
                    <span className={"feedback-meter__fill" + (percent >= 100 ? " feedback-meter__fill--perfect" : "")} style={{ width: percent + "%" }} />
                </span>
                <span className="feedback-meter__value">{percent}%</span>
            </div>
        </div>
    );
}

export default DiscardFeedback;
