import React from 'react';
import { render } from 'react-dom';
import Router from './components/Router';
import './css/styles.css';
import 'semantic-ui-css/semantic.min.css';

render(<Router />, document.querySelector('#main'));