import es6x from 'es6x';
import renderComponent from './renderComponent';

es6x.setOutputMethod(renderComponent, false);

export { es6x as default };
