import React from 'react';
import { Container, Collapse, Card, CardBody, Button, Row, Col } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import StatsChart from './StatsChart';
import MistakeBreakdown from './MistakeBreakdown';

class StatsDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.toggleStats = this.toggleStats.bind(this);
        this.toggleConfirm = this.toggleConfirm.bind(this);
        this.onImportFile = this.onImportFile.bind(this);
        this.fileInput = React.createRef();
        this.state = {
            statsCollapsed: true,
            confirmCollapsed: true,
            importFailed: false
        };
    }

    toggleStats() {
        this.setState({ statsCollapsed: !this.state.statsCollapsed });
    }

    toggleConfirm() {
        this.setState({ confirmCollapsed: !this.state.confirmCollapsed });
    }

    /** Reads the chosen backup file and hands the parsed payload to the trainer. */
    onImportFile(event) {
        let file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) return;

        let reader = new FileReader();
        reader.onload = () => {
            let applied = false;
            try {
                applied = this.props.onImport(JSON.parse(reader.result));
            } catch {
                applied = false;
            }
            this.setState({ importFailed: !applied });
        };
        reader.onerror = () => this.setState({ importFailed: true });
        reader.readAsText(file);
    }

    render() {
        let optimalDiscardRate = this.props.values.totalOptimalDiscards / this.props.values.totalDiscards;
        if (isNaN(optimalDiscardRate)) optimalDiscardRate = 0;
        optimalDiscardRate *= 100;
        optimalDiscardRate = Math.round(optimalDiscardRate);

        let efficiency = this.props.values.totalEfficiency / this.props.values.totalPossibleEfficiency;
        if (isNaN(efficiency)) efficiency = 0;
        efficiency *= 100;
        efficiency = Math.round(efficiency);

        let averageDiscards = this.props.values.totalDiscards / this.props.values.totalTenpai;
        if (isNaN(averageDiscards)) averageDiscards = 0;
        averageDiscards = Math.round(averageDiscards * 10) / 10;

        let { t } = this.props;

        return (
            <Container>
                <Button color="primary" onClick={this.toggleStats}>{t("stats.buttonLabel")}</Button>
                <Collapse isOpen={!this.state.statsCollapsed}>
                    <Card><CardBody>
                        <StatsChart history={this.props.history} />
                        <Row>
                            {t("stats.info")}
                        </Row>
                        <Row>
                            {t("stats.ready", { count: this.props.values.totalTenpai })}
                        </Row>
                        <Row>
                            {t("stats.discards", { count: this.props.values.totalDiscards })}
                        </Row>
                        <Row>
                            {t("stats.average", { average: averageDiscards })}
                        </Row>
                        <Row>
                            {t("stats.optimal", { count: this.props.values.totalOptimalDiscards })}
                        </Row>
                        <Row>
                            {t("stats.optimalRate", { percent: optimalDiscardRate, achieved: this.props.values.totalOptimalDiscards, total: this.props.values.totalDiscards })}
                        </Row>
                        <Row>
                            {t("stats.efficiency", { count: this.props.values.totalEfficiency })}
                        </Row>
                        <Row>
                            {t("stats.possible", { count: this.props.values.totalPossibleEfficiency })}
                        </Row>
                        <Row>
                            {t("stats.overall", { percent: efficiency, achieved: this.props.values.totalEfficiency, total: this.props.values.totalPossibleEfficiency })}
                        </Row>
                        <MistakeBreakdown mistakes={this.props.mistakes} />
                        <Row className="mt-3 stats-backup-row">
                            <Button color="primary" onClick={this.props.onExport}>{t("stats.export")}</Button>
                            <Button color="secondary" onClick={() => this.fileInput.current && this.fileInput.current.click()}>{t("stats.import")}</Button>
                            <input
                                ref={this.fileInput}
                                type="file"
                                accept=".json,application/json"
                                style={{ display: "none" }}
                                onChange={this.onImportFile}
                            />
                        </Row>
                        {this.state.importFailed &&
                            <Row className="stats-import-error">
                                {t("stats.importError")}
                            </Row>
                        }
                        <Row className="stats-storage-note">
                            {this.props.persistent
                                ? t("stats.storagePersistent")
                                : t("stats.storageBestEffort")}
                        </Row>
                        <Row className="mt-4">
                            <Button color="danger" onClick={this.toggleConfirm}>{t("stats.reset")}</Button>
                        </Row>
                        <Row>
                            <Collapse isOpen={!this.state.confirmCollapsed}>
                                <Card><CardBody>
                                    <Row>{t("stats.confirmation")}</Row>
                                    <Row>
                                        <Button color="danger" onClick={this.props.onReset}>{t("stats.yes")}</Button>
                                        <Col xs="1" />
                                        <Button color="success" onClick={this.toggleConfirm}>{t("stats.no")}</Button>
                                    </Row>
                                </CardBody></Card>
                            </Collapse>
                        </Row>
                    </CardBody></Card>
                </Collapse>
            </Container>
        );
    }
}

export default withTranslation()(StatsDisplay);
