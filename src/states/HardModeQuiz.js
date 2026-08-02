import React from 'react';
import { Badge, Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import Hand from '../components/Hand';
import { getTileAsText, convertRedFives } from '../scripts/TileConversions';
import {
    advanceHardModeRound,
    analyzeHardModePosition,
    createHardModeRound
} from '../scripts/HardModeSimulation';

const EMPTY_STATS = { attempts: 0, correct: 0, streak: 0 };

class HardModeQuiz extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searching: true,
            handsSearched: 0,
            puzzle: null,
            feedback: null,
            stats: EMPTY_STATS
        };
        this.searchTimer = null;
        this.searchRound = null;
        this.searchHands = 0;
        this.runSearchChunk = this.runSearchChunk.bind(this);
        this.startSearch = this.startSearch.bind(this);
        this.onTileClicked = this.onTileClicked.bind(this);
    }

    componentDidMount() {
        let stats = EMPTY_STATS;
        try {
            let saved = window.localStorage.getItem('hardModeStats');
            if (saved) {
                let parsed = JSON.parse(saved);
                stats = {
                    attempts: parsed.attempts || 0,
                    correct: parsed.correct || 0,
                    streak: parsed.streak || 0
                };
            }
        } catch { }

        this.setState({ stats }, this.startSearch);
    }

    componentWillUnmount() {
        if (this.searchTimer != null) clearTimeout(this.searchTimer);
    }

    startSearch() {
        if (this.searchTimer != null) clearTimeout(this.searchTimer);
        this.searchRound = createHardModeRound();
        this.searchHands = 1;
        this.setState({
            searching: true,
            handsSearched: 1,
            puzzle: null,
            feedback: null
        }, () => {
            this.searchTimer = setTimeout(this.runSearchChunk, 0);
        });
    }

    runSearchChunk() {
        // A few decisions per task keeps even slower phones responsive.
        for (let step = 0; step < 4; step++) {
            let analysis = analyzeHardModePosition(this.searchRound);
            if (analysis.isPuzzle) {
                this.searchTimer = null;
                this.setState({
                    searching: false,
                    handsSearched: this.searchHands,
                    puzzle: {
                        round: this.searchRound,
                        analysis: analysis
                    }
                });
                return;
            }

            let advanced = advanceHardModeRound(this.searchRound, analysis);
            if (advanced.complete) {
                this.searchRound = createHardModeRound();
                this.searchHands++;
            } else {
                this.searchRound = advanced.round;
            }
        }

        this.setState({ handsSearched: this.searchHands });
        this.searchTimer = setTimeout(this.runSearchChunk, 10);
    }

    onTileClicked(event) {
        if (!this.state.puzzle || this.state.feedback) return;

        let chosenPhysical = parseInt(event.target.name);
        let chosen = convertRedFives(chosenPhysical);
        let analysis = this.state.puzzle.analysis;
        let correct = analysis.bestTiles.indexOf(chosen) >= 0;
        let chosenEvaluation = analysis.evaluations[chosen];
        let stats = {
            attempts: this.state.stats.attempts + 1,
            correct: this.state.stats.correct + (correct ? 1 : 0),
            streak: correct ? this.state.stats.streak + 1 : 0
        };

        try {
            window.localStorage.setItem('hardModeStats', JSON.stringify(stats));
        } catch { }

        this.setState({
            feedback: {
                correct,
                chosen,
                chosenEvaluation
            },
            stats
        });
    }

    tileList(tiles) {
        let { t } = this.props;
        return tiles.map((tile) => getTileAsText(t, tile, false)).join(' / ');
    }

    renderShape(shape) {
        let { t } = this.props;
        return (
            <div className="hard-mode-shape" key={shape}>
                <strong>{t(`stats.mistakes.presentNames.${shape}`)}</strong>
                <span>{t(`stats.mistakes.presentPatterns.${shape}`)}</span>
                <small>{t('hardMode.winningTiles', { waits: t(`stats.mistakes.presentWinning.${shape}`) })}</small>
            </div>
        );
    }

    render() {
        let { t } = this.props;
        let { puzzle, feedback, searching, stats } = this.state;
        let accuracy = stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0;

        return (
            <Container className="hard-mode-page">
                <Row>
                    <Col xs="12">
                        <section className="hard-mode-hero">
                            <div>
                                <Badge color="warning">{t('hardMode.badge')}</Badge>
                                <h2>{t('hardMode.title')}</h2>
                                <p>{t('hardMode.description')}</p>
                            </div>
                            <div className="hard-mode-score" aria-label={t('hardMode.statsLabel')}>
                                <div><strong>{stats.streak}</strong><span>{t('hardMode.streak')}</span></div>
                                <div><strong>{accuracy}%</strong><span>{t('hardMode.accuracy')}</span></div>
                                <div><strong>{stats.attempts}</strong><span>{t('hardMode.solved')}</span></div>
                            </div>
                        </section>
                    </Col>
                </Row>

                {searching &&
                    <Row>
                        <Col xs="12">
                            <Card className="hard-mode-search" aria-live="polite">
                                <CardBody>
                                    <span className="hard-mode-spinner" aria-hidden="true" />
                                    <div>
                                        <h3>{t('hardMode.searching')}</h3>
                                        <p>{t('hardMode.searchProgress', { count: this.state.handsSearched })}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                }

                {puzzle &&
                    <React.Fragment>
                        <Row>
                            <Col lg="8" xs="12">
                                <Card className="hard-mode-table">
                                    <CardBody>
                                        <div className="hard-mode-meta">
                                            <span>{t('hardMode.turn', { count: puzzle.round.turn })}</span>
                                            <span>{t('hardMode.autoplayed', { count: puzzle.round.discards.length })}</span>
                                            <span>{t('hardMode.shanten', { count: puzzle.analysis.shanten })}</span>
                                        </div>
                                        <h3>{feedback ? t('hardMode.review') : t('hardMode.prompt')}</h3>
                                        <p>{feedback ? t('hardMode.reviewHint') : t('hardMode.promptHint')}</p>
                                        <div className={'hand-tray hard-mode-hand' + (feedback ? ' hard-mode-hand--locked' : '')}>
                                            <Hand
                                                tiles={puzzle.round.hand}
                                                lastDraw={puzzle.round.lastDraw}
                                                drawId={puzzle.round.turn}
                                                onTileClick={feedback ? undefined : this.onTileClicked}
                                                showIndexes={true}
                                            />
                                        </div>

                                        {feedback &&
                                            <div className={'hard-mode-feedback ' + (feedback.correct ? 'is-correct' : 'is-wrong')} aria-live="polite">
                                                <h3>{t(feedback.correct ? 'hardMode.correct' : 'hardMode.incorrect')}</h3>
                                                <p>
                                                    {t('hardMode.chosenResult', {
                                                        tile: getTileAsText(t, feedback.chosen, false),
                                                        count: feedback.chosenEvaluation.value
                                                    })}
                                                </p>
                                                {!feedback.correct &&
                                                    <p>{t('hardMode.bestResult', {
                                                        tiles: this.tileList(puzzle.analysis.bestTiles),
                                                        count: puzzle.analysis.bestValue
                                                    })}</p>
                                                }
                                                <p>{t('hardMode.improvingTiles', {
                                                    tiles: this.tileList(feedback.chosenEvaluation.tiles)
                                                })}</p>
                                                <Button color="primary" onClick={this.startSearch}>{t('hardMode.next')}</Button>
                                            </div>
                                        }
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg="4" xs="12">
                                <Card className="hard-mode-coach">
                                    <CardBody>
                                        <h3>{t('hardMode.shapeTitle')}</h3>
                                        <p>{feedback ? t('hardMode.shapeRevealed') : t('hardMode.shapeHidden')}</p>
                                        {feedback
                                            ? puzzle.analysis.shapes.map((shape) => this.renderShape(shape))
                                            : <div className="hard-mode-mystery">?</div>
                                        }
                                        <Button color="secondary" outline onClick={this.startSearch}>{t('hardMode.skip')}</Button>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </React.Fragment>
                }
            </Container>
        );
    }
}

export default withTranslation()(HardModeQuiz);
