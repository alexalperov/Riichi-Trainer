import React from 'react';
import { Container, Row, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import UkeireQuiz from "./UkeireQuiz";
import ReplayAnalysis from "./ReplayAnalysis";
import UtilsState from "./UtilsState";
import HandExplorer from "./HandExplorer";
import Shanten from './Shanten';
import SouthFourQuiz from './SouthFourQuiz';
import { withTranslation } from "react-i18next";
import DefenseState from './DefenseState';

const STATES = {
    UKEIRE: 0,
    REPLAY: 1,
    UTILS: 2,
    EXPLORER: 3,
    SOUTH_FOUR: 4,
    DEFENSE: 5,
    SHANTEN: 6,
};

class MainMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: 0,
            dropdownOpen: false
        }
    }

    onSetActivePage(index) {
        this.setState({
            active: index
        });
    }

    toggleDropdown() {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }

    changeLanguage(newLanguage) {
        let { i18n } = this.props;
        i18n.changeLanguage(newLanguage);
    }

    render() {
        let { t } = this.props;
        let page = <Row />;
        switch (this.state.active) {
            case STATES.UKEIRE:
                page = <UkeireQuiz />; break;
            case STATES.REPLAY:
                page = <ReplayAnalysis />; break;
            case STATES.UTILS:
                page = <UtilsState />; break;
            case STATES.EXPLORER:
                page = <HandExplorer />; break;
            case STATES.SOUTH_FOUR:
                page = <SouthFourQuiz />; break;
            case STATES.DEFENSE:
                page = <DefenseState />; break;
            case STATES.SHANTEN:
                page = <Shanten />; break;
            default:
                page = <UkeireQuiz />;
        }

        const tabs = [
            { id: STATES.UKEIRE, label: t("menu.trainer") },
            { id: STATES.REPLAY, label: t("menu.analyzer") },
            { id: STATES.SOUTH_FOUR, label: t("menu.allLast") },
            { id: STATES.DEFENSE, label: t("menu.defense") },
            { id: STATES.EXPLORER, label: t("menu.explorer") },
            { id: STATES.SHANTEN, label: t("menu.shanten") },
            { id: STATES.UTILS, label: t("menu.utils") },
        ];

        return (
            <React.Fragment>
                <header className="app-header">
                    <div className="app-header__bar">
                        <h1 className="app-title">
                            <span className="app-title__mark" role="img" aria-label="Mahjong tile">🀄</span>
                            <span>Riichi <span className="app-title__accent">Trainer</span></span>
                        </h1>
                        <Dropdown className="lang-dropdown" isOpen={this.state.dropdownOpen} toggle={() => this.toggleDropdown()}>
                            <DropdownToggle caret>
                                🌐 {t("menu.language")}
                            </DropdownToggle>
                            <DropdownMenu right>
                                <DropdownItem onClick={() => this.changeLanguage("en")}>English</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("ja")}>日本語</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("ru")}>Русский</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("fr")}>Français</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("pl")}>polski</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("pt")}>Português Brasileiro</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("zh_CN")}>简体中文</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("ko")}>한국어</DropdownItem>
                                <DropdownItem onClick={() => this.changeLanguage("de")}>Deutsch</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    <nav className="app-nav" aria-label={t("menu.language")}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={"nav-tab" + (this.state.active === tab.id ? " active" : "")}
                                aria-current={this.state.active === tab.id ? "page" : undefined}
                                onClick={() => this.onSetActivePage(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </header>
                {page}
                <Container className="app-credits">
                    <Row>
                        <Col xs="12"><span>{t("credits.label")}</span></Col>
                        <Col xs="12"><span>{t("credits.tilesPreLink")} <a href="https://github.com/FluffyStuff/riichi-mahjong-tiles">{t("credits.tilesLinkText")}</a>{t("credits.tilesPostLink")}<a href="https://creativecommons.org/licenses/by/4.0/">{t("credits.ccLinkText")}</a></span></Col>
                        <Col xs="12"><span>{t("credits.shantenPreLink")}<a href="http://cmj3.web.fc2.com/#syanten">{t("credits.shantenLinkText")}</a>{t("credits.shantenPostLink")}</span></Col>
                    </Row>
                </Container>
            </React.Fragment>
        );
    }
}

export default withTranslation()(MainMenu);
