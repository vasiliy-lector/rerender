import { createTemplate } from './createTemplate';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { StatelessComponent } from './types';

const defaults = { id : 1 };
const fn: StatelessComponent<{ id: number }, typeof defaults> = (props) => props.id.toFixed(0);
fn.defaults = defaults;

const b = new TemplateComponentStateless(fn, { uniqid: 'sdf', id: 3 }, null);
