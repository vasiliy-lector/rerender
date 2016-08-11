import t7 from 't7';

t7.setOutput(t7.Outputs.Universal);

// in browser t7 must be global
if (typeof window !== 'undefined') {
    window.t7 = t7;
}

export { t7 as default };
