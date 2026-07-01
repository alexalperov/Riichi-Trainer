import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import * as serviceWorker from './serviceWorker';
import "./i18n";

//import UkeireQuiz from './states/UkeireQuiz';
//import HandExplorer from './states/HandExplorer';
//import ReplayAnalysis from './states/ReplayAnalysis';
import MainMenu from './states/MainMenu';

ReactDOM.render(<MainMenu />, document.getElementById('root'));
// Unregister the service worker: its cache-first PWA behaviour made
// deployed updates invisible until every tab was closed. This app doesn't
// need offline support, so we actively unregister any existing worker so
// new deploys are always picked up immediately.
serviceWorker.unregister();